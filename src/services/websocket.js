import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useEffect, useState } from "react";

// Polyfill for global variable (required by STOMP.js in browser)
if (typeof global === "undefined") {
  window.global = window;
}

class WebSocketService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    // Event listeners for connection events (connect/disconnect/error)
    this.eventListeners = new Map();
    // Active STOMP subscriptions: destination -> { subscription, callbacks[] }
    this.stompSubscriptions = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  connect() {
    if (this.client?.connected) {
      return this.client;
    }

    try {
      const socket = new SockJS("http://localhost:8080/ws");

      // Pass auth token via STOMP connect headers for user-level subscriptions
      const token = localStorage.getItem("token");
      const connectHeaders = {};
      if (token) {
        connectHeaders.Authorization = `Bearer ${token}`;
      }

      this.client = new Client({
        webSocketFactory: () => socket,
        connectHeaders,
        debug: (str) => {
          console.log("STOMP Debug:", str);
        },
        onConnect: (frame) => {
          console.log("WebSocket connected");
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.reconnectDelay = 1000;
          // Re-establish all active STOMP subscriptions
          this._reestablishSubscriptions();
          this._notifyEventListeners("connect", frame);
        },
        onDisconnect: () => {
          console.log("WebSocket disconnected");
          this.isConnected = false;
          this._notifyEventListeners("disconnect", {});
          this._attemptReconnect();
        },
        onStompError: (frame) => {
          console.error("STOMP Error:", frame);
          this.isConnected = false;
          this._notifyEventListeners("error", frame);
          this._attemptReconnect();
        },
        onWebSocketError: (error) => {
          console.error("WebSocket Error:", error);
          this.isConnected = false;
          this._notifyEventListeners("error", error);
          this._attemptReconnect();
        },
      });

      this.client.activate();
      return this.client;
    } catch (error) {
      console.error("Error creating WebSocket connection:", error);
      this._notifyEventListeners("error", error);
      this._attemptReconnect();
      return null;
    }
  }

  disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
      this.isConnected = false;
      this.reconnectAttempts = 0;
    }
  }

  _attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("Max reconnection attempts reached");
      return;
    }

    this.reconnectAttempts++;
    console.log(
        `Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${this.reconnectDelay}ms`
    );

    setTimeout(() => {
      this.connect();
    }, this.reconnectDelay);

    // Exponential backoff
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
  }

  _reestablishSubscriptions() {
    // Re-subscribe all tracked destinations with the STOMP client
    for (const [destination, entry] of this.stompSubscriptions) {
      if (entry.callbacks.length > 0) {
        entry.stompSub = this._doStompSubscribe(destination, entry.callbacks);
      }
    }
  }

  _doStompSubscribe(destination, callbacksRef) {
    if (!this.client || !this.isConnected) {
      console.warn("Cannot subscribe: WebSocket not connected");
      return null;
    }
    try {
      const sub = this.client.subscribe(destination, (message) => {
        try {
          const data = JSON.parse(message.body);
          // Call all registered callbacks for this destination
          callbacksRef.forEach((cb) => cb(data));
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
          callbacksRef.forEach((cb) => cb(message.body));
        }
      });
      return sub;
    } catch (error) {
      console.error("Error subscribing to STOMP destination:", error);
      return null;
    }
  }

  /**
   * Subscribe to a STOMP topic destination.
   * Returns an unsubscribe function for cleanup.
   */
  subscribe(destination, callback) {
    if (!this.stompSubscriptions.has(destination)) {
      this.stompSubscriptions.set(destination, { stompSub: null, callbacks: [] });
    }

    const entry = this.stompSubscriptions.get(destination);
    entry.callbacks.push(callback);

    // If already connected and no active STOMP subscription exists, create one now
    if (this.isConnected && this.client) {
      if (!entry.stompSub) {
        entry.stompSub = this._doStompSubscribe(destination, entry.callbacks);
      }
    } else if (!this.client) {
      this.connect();
    }
  }

  /**
   * Unsubscribe a specific callback from a STOMP destination.
   * When no callbacks remain, the STOMP subscription is cancelled.
   */
  unsubscribe(destination, callback) {
    if (!this.stompSubscriptions.has(destination)) return;

    const entry = this.stompSubscriptions.get(destination);
    const idx = entry.callbacks.indexOf(callback);
    if (idx > -1) {
      entry.callbacks.splice(idx, 1);
    }

    // If no more callbacks, actually unsubscribe from STOMP
    if (entry.callbacks.length === 0) {
      if (entry.stompSub) {
        try {
          entry.stompSub.unsubscribe();
        } catch (e) {
          console.error("Error unsubscribing STOMP subscription:", e);
        }
      }
      this.stompSubscriptions.delete(destination);
    }
  }

  emit(destination, data) {
    if (this.client && this.isConnected) {
      this.client.publish({
        destination: destination,
        body: JSON.stringify(data),
      });
    }
  }

  // ─── Connection event listener management (NOT STOMP topics) ───────────────

  onEvent(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  offEvent(event, callback) {
    if (!this.eventListeners.has(event)) return;
    const listeners = this.eventListeners.get(event);
    const idx = listeners.indexOf(callback);
    if (idx > -1) {
      listeners.splice(idx, 1);
    }
  }

  _notifyEventListeners(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach((cb) => cb(data));
    }
  }

  // ─── Convenience methods ────────────────────────────────────────────────────

  // Generic order updates (used by admin LiveOrders)
  subscribeToOrderUpdates(callback) {
    this.subscribe("/topic/orderUpdates", callback);
  }

  unsubscribeFromOrderUpdates(callback) {
    this.unsubscribe("/topic/orderUpdates", callback);
  }

  // Branch Manager: subscribe to /topic/branch.{branchId}.manager
  subscribeToBranchManagerUpdates(branchId, callback) {
    // FIXED: Changed slashes to dots for RabbitMQ routing
    this.subscribe(`/topic/branch.${branchId}.manager`, callback);
  }

  unsubscribeFromBranchManagerUpdates(branchId, callback) {
    // FIXED: Updated to exactly match the subscribe string
    this.unsubscribe(`/topic/branch.${branchId}.manager`, callback);
  }

  // Delivery: subscribe to global unassigned topic
  subscribeToDeliveryGlobalUnassigned(callback) {
    // FIXED: Changed slashes to dots for RabbitMQ routing
    this.subscribe("/topic/delivery.global.unassigned", callback);
  }

  unsubscribeFromDeliveryGlobalUnassigned(callback) {
    // FIXED: Updated to exactly match the subscribe string
    this.unsubscribe("/topic/delivery.global.unassigned", callback);
  }

  // Individual delivery person: subscribe to /user/queue/updates
  subscribeToUserUpdates(callback) {
    // SAFE: RabbitMQ permits slashes in /queue/ paths, so this remains unchanged
    this.subscribe("/user/queue/updates", callback);
  }

  unsubscribeFromUserUpdates(callback) {
    this.unsubscribe("/user/queue/updates", callback);
  }

  cleanup() {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
      this.isConnected = false;
      this.stompSubscriptions.clear();
      this.eventListeners.clear();
      this.reconnectAttempts = 0;
    }
  }
}

// Singleton instance
const webSocketService = new WebSocketService();

// React hook for using WebSocket
export const useWebSocket = () => {
  const [isConnected, setIsConnected] = useState(webSocketService.isConnected);

  useEffect(() => {
    // Connect if not already connected
    if (!webSocketService.client) {
      webSocketService.connect();
    }

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);
    const handleError = (error) => console.error("WebSocket error:", error);

    webSocketService.onEvent("connect", handleConnect);
    webSocketService.onEvent("disconnect", handleDisconnect);
    webSocketService.onEvent("error", handleError);

    // Sync current state in case we connected before registering listeners
    setIsConnected(webSocketService.isConnected);

    return () => {
      webSocketService.offEvent("connect", handleConnect);
      webSocketService.offEvent("disconnect", handleDisconnect);
      webSocketService.offEvent("error", handleError);
    };
  }, []);

  return {
    isConnected,
    subscribe: webSocketService.subscribe.bind(webSocketService),
    unsubscribe: webSocketService.unsubscribe.bind(webSocketService),
    emit: webSocketService.emit.bind(webSocketService),
  };
};

export default webSocketService;