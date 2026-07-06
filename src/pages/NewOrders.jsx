import React, { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orderAPI } from "../services/api";
import webSocketService from "../services/websocket";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Package,
  ArrowLeft,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { Link } from "react-router-dom";

const NewOrders = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const queryClient = useQueryClient();

  // Fetch all orders and filter on frontend
  const {
    data: ordersData,
    isLoading: ordersLoading,
    error: ordersError,
    refetch,
  } = useQuery({
    queryKey: ["new-orders"],
    queryFn: () => orderAPI.getAllOrders({ page: 0, size: 100 }),
    refetchInterval: 30000, // Refetch every 30 seconds as fallback
  });

  // Update order status mutation
  const updateOrderStatusMutation = useMutation({
    mutationFn: (orderData) => orderAPI.updateOrderStatus(orderData),
    onSuccess: () => {
      queryClient.invalidateQueries(["new-orders"]);
      setLastUpdate(new Date());
    },
  });

  // WebSocket connection and event handlers
  useEffect(() => {
    const connectWebSocket = () => {
      webSocketService.connect();
      setIsConnected(true);

      // Subscribe to order updates (handles ADD, UPDATE, REMOVE via wsAction)
      const handleOrderUpdate = (updatedOrder) => {
        console.log("Order update received:", updatedOrder);
        queryClient.invalidateQueries(["new-orders"]);
        setLastUpdate(new Date());
      };

      webSocketService.subscribeToOrderUpdates(handleOrderUpdate);

      return () => {
        webSocketService.unsubscribeFromOrderUpdates(handleOrderUpdate);
      };
    };

    const cleanup = connectWebSocket();

    return () => {
      if (cleanup) cleanup();
      webSocketService.disconnect();
      setIsConnected(false);
    };
  }, [queryClient]);

  // Filter orders to show only those that are not delivered (regardless of payment status)
  const orders =
    ordersData?.data?.data?.content || ordersData?.data?.data || [];
  const filteredOrders = orders.filter(
    (order) => order.orderStatus !== "DELIVERED"
  );

  const getOrderStatusColor = (status) => {
    switch (status) {
      case "INITIALIZED":
        return "bg-gray-100 text-gray-800";
      case "CONFIRMED":
        return "bg-blue-100 text-blue-800";
      case "ON_THE_WAY":
        return "bg-purple-100 text-purple-800";
      case "DELIVERED":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      case "FAILED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "PENDING_PAYMENT":
        return "bg-blue-100 text-blue-800";
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      case "FAILED":
        return "bg-red-100 text-red-800";
      case "CANCELED":
        return "bg-red-100 text-red-800";
      case "REFUNDED":
        return "bg-orange-100 text-orange-800";
      case "TO_REFUND":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (orderStatus, paymentStatus) => {
    if (
      orderStatus === "CANCELLED" ||
      orderStatus === "FAILED" ||
      paymentStatus === "REJECTED" ||
      paymentStatus === "FAILED"
    ) {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
    if (orderStatus === "DELIVERED" && paymentStatus === "COMPLETED") {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    if (orderStatus === "ON_THE_WAY" || paymentStatus === "PENDING_PAYMENT") {
      return <Clock className="h-5 w-5 text-blue-500" />;
    }
    return <AlertCircle className="h-5 w-5 text-yellow-500" />;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleUpdateOrderStatus = (orderId, newStatus, statusType) => {
    const updateData = { id: orderId };
    if (statusType === "orderStatus") {
      updateData.orderStatus = newStatus;
    } else if (statusType === "paymentStatus") {
      updateData.paymentStatus = newStatus;
    }
    updateOrderStatusMutation.mutate(updateData);
  };

  const handleRefresh = () => {
    refetch();
    setLastUpdate(new Date());
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" asChild>
            <Link to="/admin">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Active Orders</h1>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div
              className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"
                }`}
            ></div>
            <span className="text-sm text-muted-foreground">
              {isConnected ? "Live Updates" : "Disconnected"}
            </span>
          </div>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={ordersLoading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${ordersLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Active Orders
                </p>
                <p className="text-2xl font-bold">{filteredOrders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Pending Orders
                </p>
                <p className="text-2xl font-bold">
                  {
                    filteredOrders.filter(
                      (order) =>
                        order.orderStatus === "INITIALIZED" ||
                        order.orderStatus === "CONFIRMED"
                    ).length
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold">
                  {
                    filteredOrders.filter(
                      (order) => order.orderStatus === "ON_THE_WAY"
                    ).length
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Last Update Info */}
      <div className="text-sm text-muted-foreground">
        Last updated: {lastUpdate.toLocaleTimeString()}
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {ordersLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading orders...</span>
          </div>
        )}

        {ordersError && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-md">
            Error loading orders: {ordersError.message}
          </div>
        )}

        {!ordersLoading && !ordersError && filteredOrders.length === 0 && (
          <div className="text-center py-8">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">No new orders</p>
            <p className="text-muted-foreground/70 text-sm">
              Orders will appear here until they are delivered
            </p>
          </div>
        )}

        {!ordersLoading &&
          !ordersError &&
          filteredOrders.map((order) => (
            <Card key={order.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {getStatusIcon(order.orderStatus, order.paymentStatus)}
                      <h3 className="text-lg font-semibold">
                        Order #{order.id}
                      </h3>
                      <Badge className={getOrderStatusColor(order.orderStatus)}>
                        {order.orderStatus?.replace("_", " ")}
                      </Badge>
                      <Badge
                        className={getPaymentStatusColor(order.paymentStatus)}
                      >
                        {order.paymentStatus?.replace("_", " ")}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                      <div>
                        <p>
                          <strong>Customer:</strong> {order.user?.email}
                        </p>
                        <p>
                          <strong>Date:</strong> {formatDate(order.orderDate)}
                        </p>
                      </div>
                      <div>
                        <p>
                          <strong>Total:</strong> ALL {order.totalAmount?.toFixed(2)}
                        </p>
                        <p>
                          <strong>Items:</strong>{" "}
                          {order.orderItems?.length || 0}
                        </p>
                      </div>
                    </div>

                    {/* Order Items */}
                    {order.orderItems && order.orderItems.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-foreground mb-2">
                          Order Items:
                        </p>
                        <div className="space-y-1">
                          {order.orderItems.map((item, index) => (
                            <div
                              key={index}
                              className="text-sm text-muted-foreground flex justify-between"
                            >
                              <div className="flex flex-col">
                                <span>
                                  {item.menuItem?.name || item.menu?.name} x {item.quantity}
                                </span>
                                {(item.variants || []).length > 0 && (
                                  <div className="text-xs text-muted-foreground/80 pl-2">
                                    {item.variants.map((variant) => (
                                      <div key={variant.id} className="flex gap-1">
                                        <span>+ {variant.variantName}</span>
                                        {variant.priceCharged > 0 && (
                                          <span>
                                            (ALL{" "}
                                            {variant.priceCharged.toFixed(2)})
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <span>
                                ALL {(
                                  item.menuItem?.price * item.quantity
                                )?.toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="ml-6 space-y-3">
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">
                        Order Status
                      </label>
                      <select
                        value={order.orderStatus || ""}
                        onChange={(e) =>
                          handleUpdateOrderStatus(
                            order.id,
                            e.target.value,
                            "orderStatus"
                          )
                        }
                        className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground shadow-sm hover:shadow-md transition-all duration-200 focus:border-transparent cursor-pointer"
                      >
                        <option value="INITIALIZED">Initialized</option>
                        <option value="CONFIRMED">Confirmed</option>
                        <option value="ON_THE_WAY">On The Way</option>
                        <option value="DELIVERED">Delivered</option>
                        <option value="CANCELLED">Cancelled</option>
                        <option value="FAILED">Failed</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">
                        Payment Status
                      </label>
                      <select
                        value={order.paymentStatus || ""}
                        onChange={(e) =>
                          handleUpdateOrderStatus(
                            order.id,
                            e.target.value,
                            "paymentStatus"
                          )
                        }
                        className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground shadow-sm hover:shadow-md transition-all duration-200 focus:border-transparent cursor-pointer"
                      >
                        <option value="PENDING">Pending</option>
                        <option value="PENDING_PAYMENT">Pending Payment</option>
                      <option value="EXPIRED">Expired</option>
                      <option value="ABANDONED">Abandoned</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="REJECTED">Rejected</option>
                        <option value="FAILED">Failed</option>
                        <option value="REFUNDED">Refunded</option>
                        <option value="CANCELED">Canceled</option>
                        <option value="TO_REFUND">To Refund</option>
                      </select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
};

export default NewOrders;
