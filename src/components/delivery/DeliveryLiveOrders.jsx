import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../ui/button";
import { RefreshCw } from "lucide-react";
import { useWebSocket } from "../../services/websocket";
import DeliveryOrdersTable from "./DeliveryOrdersTable";
import OrderDetailModal from "../admin/OrderDetailModal";
import { orderAPI } from "../../services/api";

const DeliveryLiveOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newOrderCount, setNewOrderCount] = useState(0);

  // WebSocket connection for real-time updates
  const { isConnected, subscribe, unsubscribe } = useWebSocket();

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await orderAPI.getReadyForPickupOrders({ page: 0, size: 50 });
      const data = response.data;
      console.log("API Response:", data);

      if (data && data.data && data.data.content) {
        setOrders(data.data.content);
        console.log("Orders found:", data.data.content);
      } else {
        console.log("No orders found in response");
        setOrders([]);
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // WebSocket event handlers
  // Subscribes to /topic/delivery/global/unassigned for all unassigned order updates
  // Also subscribes to /user/queue/updates for personal delivery updates
  useEffect(() => {
    if (isConnected && user?.id) {
      console.log(
        "WebSocket connected, setting up listeners for delivery:",
        user.id
      );

      const GLOBAL_UNASSIGNED_TOPIC = "/topic/delivery.global.unassigned";

      // Handle unassigned order updates (ADD/REMOVE from backend)
      const handleUnassignedUpdate = (updated) => {
        console.log("[DeliveryLiveOrders] Unassigned update:", updated.id, updated.wsAction);

        switch (updated.wsAction) {
          case "ADD":
            setOrders((prev) => {
              const exists = prev.some((o) => o.id === updated.id);
              if (!exists) {
                console.log("Adding new unassigned order:", updated.id);
                setNewOrderCount((c) => c + 1);
                setTimeout(() => setNewOrderCount(0), 3000);
                return [...prev, updated];
              }
              return prev;
            });
            break;
          case "REMOVE":
            setOrders((prev) => prev.filter((o) => o.id !== updated.id));
            break;
          default:
            // For any other action, update in place if exists
            setOrders((prev) =>
              prev.map((o) => (o.id === updated.id ? updated : o))
            );
        }
      };

      // Handle personal delivery updates (orders assigned to this user)
      const handlePersonalUpdate = (updated) => {
        console.log("[DeliveryLiveOrders] Personal update:", updated.id, updated.orderStatus);
        // When an order is assigned to us, remove it from the unassigned list
        setOrders((prev) => prev.filter((o) => o.id !== updated.id));
      };

      // Subscribe to global unassigned topic
      subscribe(GLOBAL_UNASSIGNED_TOPIC, handleUnassignedUpdate);

      // Subscribe to personal user queue for assigned order updates
      subscribe("/user/queue/updates", handlePersonalUpdate);

      return () => {
        console.log("Cleaning up WebSocket listeners");
        unsubscribe(GLOBAL_UNASSIGNED_TOPIC, handleUnassignedUpdate);
        unsubscribe("/user/queue/updates", handlePersonalUpdate);
      };
    } else {
      console.log(
        "WebSocket not connected or user not loaded, skipping subscription setup"
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, user?.id]);


  // Handle order assignment - assigns order to delivery person
  const handleAssignOrder = async (orderId) => {
    try {
      console.log("Assigning order to delivery person:", { orderId, deliveryId: user?.id });

      // Validate orderId and user
      if (!orderId) {
        console.error("Order ID is null or undefined");
        return;
      }

      if (!user?.id) {
        console.error("User ID is null or undefined");
        return;
      }

      // Use the dedicated assign-order-delivery endpoint
      await orderAPI.assignOrderDelivery(orderId);

      console.log(`Order ${orderId} assigned to delivery person ${user.id}`);

      // Refresh the orders list to remove the assigned order
      await fetchOrders();
    } catch (err) {
      console.error("Error assigning order:", err);
    }
  };

  // Handle view order details
  const handleViewOrderDetails = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  // Handle close modal
  const handleCloseModal = () => {
    setSelectedOrder(null);
    setIsModalOpen(false);
  };

  useEffect(() => {
    if (user?.id) {
      fetchOrders();
    }
  }, [user?.id]);

  return (
    <div className="min-h-screen bg-background">
      {/* Real-time Header */}
      <div className="bg-card shadow-lg border-b border-border">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div
                    className={`w-4 h-4 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"
                      }`}
                  />
                  {isConnected && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  )}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">
                    Unassigned Orders
                  </h1>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Orders unassigned that are confirmed by the venue restaurant
                  </p>
                </div>
                <div className="flex items-center space-x-2"></div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right relative">
                <div className="text-2xl font-bold text-foreground">
                  {orders.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Unassigned Orders
                </div>
                {newOrderCount > 0 && (
                  <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-bounce">
                    {newOrderCount}
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchOrders}
                disabled={loading}
                className="shadow-sm"
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Loading live orders...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-16">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 max-w-md mx-auto">
              <div className="w-12 h-12 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <RefreshCw className="h-6 w-6 text-destructive" />
              </div>
              <h3 className="text-lg font-semibold text-destructive mb-2">
                Connection Error
              </h3>
              <p className="text-destructive/80 text-sm mb-4">{error}</p>
              <Button onClick={fetchOrders} variant="destructive">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Connection
              </Button>
            </div>
          </div>
        )}

        {/* No Orders State */}
        {!loading && !error && orders.length === 0 && (
          <div className="text-center py-16">
            <div className="bg-card rounded-lg shadow-lg p-8 max-w-md mx-auto border border-border">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <RefreshCw className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                All Caught Up!
              </h3>
              <p className="text-muted-foreground">
                No orders assigned to you at the moment
              </p>
            </div>
          </div>
        )}

        {/* Orders Table */}
        {!loading && !error && orders.length > 0 && (
          <div className="bg-card rounded-lg shadow-lg overflow-hidden border border-border">
            <div className="px-6 py-4 border-b border-border">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">
                  Unassigned Orders
                </h2>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                    Real-time Updates
                  </span>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <DeliveryOrdersTable
                orders={orders}
                onAssignOrder={handleAssignOrder}
                onViewOrderDetails={handleViewOrderDetails}
              />
            </div>
          </div>
        )}

        {/* Order Detail Modal */}
        <OrderDetailModal
          order={selectedOrder}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      </div>
    </div>
  );
};

export default DeliveryLiveOrders;
