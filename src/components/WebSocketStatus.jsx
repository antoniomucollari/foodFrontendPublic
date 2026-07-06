import React, { useState, useEffect } from 'react';
import webSocketService from '../services/websocket';

const WebSocketStatus = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);

  useEffect(() => {
    const client = webSocketService.connect();

    const handleConnect = () => {
      setIsConnected(true);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleOrderUpdate = (data) => {
      setLastMessage({ type: 'Order Update', data, timestamp: new Date() });
    };

    // Subscribe to connection events
    webSocketService.subscribe('connect', handleConnect);
    webSocketService.subscribe('disconnect', handleDisconnect);
    webSocketService.subscribeToOrderUpdates(handleOrderUpdate);

    return () => {
      webSocketService.unsubscribe('connect', handleConnect);
      webSocketService.unsubscribe('disconnect', handleDisconnect);
      webSocketService.unsubscribeFromOrderUpdates(handleOrderUpdate);
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border max-w-sm">
      <div className="flex items-center space-x-2 mb-2">
        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
        <span className="text-sm font-medium">
          WebSocket: {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      {lastMessage && (
        <div className="text-xs text-gray-600">
          <p><strong>Last Event:</strong> {lastMessage.type}</p>
          <p><strong>Time:</strong> {lastMessage.timestamp.toLocaleTimeString()}</p>
          {lastMessage.data && (
            <p><strong>Order ID:</strong> {lastMessage.data.id}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default WebSocketStatus;

