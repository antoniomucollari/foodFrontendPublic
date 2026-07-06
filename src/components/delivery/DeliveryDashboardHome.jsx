import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../contexts/AuthContext";
import { orderAPI } from "../../services/api";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Package,
  Truck,
  RefreshCw,
  Eye,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import OrderDetailModal from "../admin/OrderDetailModal";
import ServerErrorDisplay from "../ui/server-error-display";
import useServerError from "../../hooks/useServerError";

const DeliveryDashboardHome = () => {
  const { user } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { serverError, handleError, clearError } = useServerError();

  // Fetch delivery statistics (monthly data with percentage difference)
  const {
    data: deliveryStatsData,
    isLoading: isLoadingStats,
    error: deliveryStatsError,
  } = useQuery({
    queryKey: ["delivery-stats"],
    queryFn: () => orderAPI.getTotalOrders(),
  });

  // Fetch incomplete assigned orders count for Active Orders metric
  const {
    data: incompleteOrdersData,
    isLoading: isLoadingIncomplete,
    error: incompleteOrdersError,
  } = useQuery({
    queryKey: ["delivery-incomplete-orders", user?.id],
    queryFn: () =>
      orderAPI.getAllOrders({
        deliveryId: user?.id,
        isIncomplete: true,
        page: 0,
        size: 1, // We only need the total count
      }),
    enabled: !!user?.id,
  });

  // Fetch recent orders assigned to this delivery person (from My Orders page)
  const {
    data: recentOrdersData,
    isLoading: isLoadingOrders,
    error: recentOrdersError,
  } = useQuery({
    queryKey: ["delivery-recent-orders", user?.id],
    queryFn: () =>
      orderAPI.getAllOrders({
        deliveryId: user?.id,
        page: 0,
        size: 5,
      }),
    enabled: !!user?.id,
  });

  // Extract delivery statistics data (same structure as admin dashboard)
  const deliveryStats = deliveryStatsData?.data?.data || {};
  const totalOrders = deliveryStats?.totalOrders ?? 0;
  const percentageDifference = deliveryStats?.percentageDifference ?? 0;

  const recentOrders = recentOrdersData?.data?.data?.content || [];
  const incompleteOrdersCount =
    incompleteOrdersData?.data?.data?.totalElements || 0;

  // Handle server errors
  const handleServerError = (error) => {
    if (handleError(error)) {
      // Server error was handled, don't show toast
      return;
    }
    // For non-server errors, let the default error handling take care of it
  };

  // Check for server errors in any of the queries
  const hasServerError =
    deliveryStatsError || incompleteOrdersError || recentOrdersError;
  if (hasServerError && !serverError) {
    // Handle the first server error found
    if (deliveryStatsError && handleError(deliveryStatsError)) return;
    if (incompleteOrdersError && handleError(incompleteOrdersError)) return;
    if (recentOrdersError && handleError(recentOrdersError)) return;
  }

  // Helper functions
  const formatPercentage = (percentage) => {
    const sign = percentage >= 0 ? "+" : "";
    return `${sign}${percentage.toFixed(1)}%`;
  };

  const getPercentageColor = (percentage) => {
    return percentage >= 0 ? "text-green-500" : "text-red-500";
  };

  const getOrderStatusColor = (status) => {
    switch (status) {
      case "INITIALIZED":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "CONFIRMED":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "ON_THE_WAY":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "DELIVERED":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "CANCELLED":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "FAILED":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
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

  const handleViewOrderDetails = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  return (
    <div className="space-y-6 p-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Delivery Dashboard
          </h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.name || user?.email}
          </p>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Server Error Display */}
      {serverError && (
        <ServerErrorDisplay
          error={serverError}
          onRetry={clearError}
          onDismiss={clearError}
          showDismissButton={true}
          title="Dashboard Error"
        />
      )}

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Total Deliveries */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Deliveries
                </p>
                <p className="text-2xl font-bold">
                  {totalOrders.toLocaleString()}
                </p>
                <div className="flex items-center mt-2">
                  {percentageDifference >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span
                    className={`text-sm ${getPercentageColor(
                      percentageDifference
                    )} cursor-help`}
                    title="this month vs last month"
                  >
                    {formatPercentage(percentageDifference)}
                  </span>
                </div>
              </div>
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Truck className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Orders */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Active Orders
                </p>
                <p className="text-2xl font-bold">{incompleteOrdersCount}</p>
                <div className="flex items-center mt-2">
                  <Package className="h-4 w-4 text-orange-500 mr-1" />
                  <span className="text-sm text-orange-500">In Progress</span>
                </div>
              </div>
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders Section */}
      <div className="w-full">
        {/* Recent Orders */}
        <div>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>My Orders</CardTitle>
                <Button variant="outline" size="sm" asChild>
                  <a href="/delivery-panel/all-orders">View All</a>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                {isLoadingOrders && (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                    <span>Loading orders...</span>
                  </div>
                )}

                {!isLoadingOrders && recentOrders.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      No orders assigned to you for delivery
                    </p>
                  </div>
                )}

                {!isLoadingOrders && recentOrders.length > 0 && (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                          Order ID
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                          Customer
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                          Amount
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                          Status
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                          Date
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((order) => (
                        <tr
                          key={order.id}
                          className="border-b border-border/50 hover:bg-muted/50 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-primary">
                                #{order.id}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium">
                                {order.user?.name || order.user?.email || "N/A"}
                              </p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold">
                              ALL {order.totalAmount?.toFixed(2) || "0.00"}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              className={getOrderStatusColor(order.orderStatus)}
                            >
                              {order.orderStatus?.replace("_", " ") ||
                                "Unknown"}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm text-muted-foreground">
                              {order.orderDate
                                ? formatDate(order.orderDate)
                                : "N/A"}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewOrderDetails(order)}
                              className="h-8 w-8 p-0"
                              title="View Order Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Order Detail Modal */}
      <OrderDetailModal
        order={selectedOrder}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default DeliveryDashboardHome;
