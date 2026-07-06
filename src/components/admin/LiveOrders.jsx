import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { RefreshCw } from "lucide-react";
import { useWebSocket } from "../../services/websocket";
import OrdersTable from "./OrdersTable";
import OrderDetailModal from "./OrderDetailModal";

const LiveOrders = () => {
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
      const response = await fetch(
        "http://localhost:8080/api/orders/unassigned-orders?page=0&size=50",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`, // Assuming token is stored in localStorage
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("API Response:", data);

      // Extract orders from the response
      if (data.data && data.data.content) {
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
  useEffect(() => {
    if (isConnected) {
      console.log("WebSocket connected, setting up listeners");

      // Handle order updates with wsAction (ADD, UPDATE, REMOVE)
      const handleOrderUpdate = (updated) => {
        console.log("Order update received via WebSocket:", updated);

        switch (updated.wsAction) {
          case "ADD":
            setOrders((prev) => {
              const exists = prev.some((o) => o.id === updated.id);
              if (!exists) {
                console.log("Adding new order to list:", updated.id);
                setNewOrderCount((prev) => prev + 1);
                // Reset counter after 3 seconds
                setTimeout(() => setNewOrderCount(0), 3000);
                return [...prev, updated];
              }
              return prev;
            });
            break;
          case "UPDATE":
            setOrders((prev) =>
              prev.map((o) => (o.id === updated.id ? updated : o))
            );
            break;
          case "REMOVE":
            setOrders((prev) => prev.filter((o) => o.id !== updated.id));
            break;
          default:
            console.warn("Unknown wsAction:", updated.wsAction);
        }
      };

      // Subscribe to WebSocket topic
      subscribe("/topic/orderUpdates", handleOrderUpdate);

      return () => {
        console.log("Cleaning up WebSocket listeners");
        unsubscribe("/topic/orderUpdates", handleOrderUpdate);
      };
    } else {
      console.log("WebSocket not connected, skipping subscription setup");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected]);

  // Helper function to check if order is incomplete
  const isOrderIncomplete = (order) => {
    const incompleteOrderStatuses = ["INITIALIZED", "CONFIRMED", "ON_THE_WAY"];
    const incompletePaymentStatuses = [
      "PENDING",
      "PENDING_PAYMENT",
      "REJECTED",
      "FAILED",
    ];

    const isOrderIncomplete = incompleteOrderStatuses.includes(
      order.orderStatus
    );
    const isPaymentIncomplete = incompletePaymentStatuses.includes(
      order.paymentStatus
    );

    return isOrderIncomplete || isPaymentIncomplete;
  };

  // Handle order status updates
  const handleUpdateOrderStatus = async (orderId, newStatus, statusType) => {
    try {
      console.log("Updating order status:", { orderId, newStatus, statusType });

      // Validate orderId
      if (!orderId) {
        console.error("Order ID is null or undefined");
        return;
      }

      // Create OrderDTO object as expected by backend
      const orderDTO = {
        id: orderId,
        [statusType]: newStatus,
      };

      // First, update the order status
      const response = await fetch(
        `http://localhost:8080/api/orders/update-status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(orderDTO),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Update failed:", errorText);
        throw new Error(
          `HTTP error! status: ${response.status} - ${errorText}`
        );
      }

      console.log(`Order ${orderId} ${statusType} updated to ${newStatus}`);

      // Then refresh the incomplete orders
      await fetchOrders();
    } catch (err) {
      console.error("Error updating order status:", err);
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
    fetchOrders();
  }, []);

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
                <h1 className="text-3xl font-bold text-foreground">
                  Live Orders
                </h1>
                <div className="flex items-center space-x-2">
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right relative">
                <div className="text-2xl font-bold text-foreground">
                  {orders.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Active Orders
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
              <p className="text-muted-foreground">
                Loading live orders...
              </p>
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
              <p className="text-destructive/80 text-sm mb-4">
                {error}
              </p>
              <Button
                onClick={fetchOrders}
                variant="destructive"
              >
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
                No orders requiring attention at the moment
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
                  Active Orders
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
              <OrdersTable
                orders={orders}
                onUpdateOrderStatus={handleUpdateOrderStatus}
                onViewOrderDetails={handleViewOrderDetails}
                showStatusControls={true}
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

export default LiveOrders;
