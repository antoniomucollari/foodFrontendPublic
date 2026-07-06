import React, { useState } from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Eye, UserCheck, MapPin, Store, X, Navigation, Loader2 } from "lucide-react";
import { restaurantBranchAPI } from "../../services/api";

const DeliveryOrdersTable = ({ orders, onAssignOrder, onViewOrderDetails }) => {
  const [branchInfo, setBranchInfo] = useState(null); // { orderId, address, latitude, longitude }
  const [branchLoading, setBranchLoading] = useState(null); // orderId being loaded

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "PENDING_PAYMENT":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "EXPIRED":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
      case "ABANDONED":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
      case "COMPLETED":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "REJECTED":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "FAILED":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "REFUNDED":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "CANCELED":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "TO_REFUND":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const month = date.toLocaleDateString("en-US", { month: "short" });
    const day = date.getDate();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${month} ${day}, ${hours}:${minutes}`;
  };

  const handleAssignOrder = (order) => {
    onAssignOrder(order.id);
  };

  const handleOpenMap = (lat, lng) => {
    if (lat && lng) {
      const url = `https://www.google.com/maps?q=${lat},${lng}`;
      window.open(url, "_blank");
    }
  };

  const handleFetchBranchLocation = async (orderId) => {
    // If already showing this order's branch info, close it
    if (branchInfo?.orderId === orderId) {
      setBranchInfo(null);
      return;
    }

    setBranchLoading(orderId);
    try {
      const response = await restaurantBranchAPI.getBranchLocation(orderId);
      const data = response.data?.data;
      if (data) {
        setBranchInfo({
          orderId,
          address: data.address,
          latitude: data.latitude,
          longitude: data.longitude,
        });
      }
    } catch (error) {
      console.error("Error fetching branch location:", error);
    } finally {
      setBranchLoading(null);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">
              Order ID
            </th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">
              Customer
            </th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">
              Customer Address
            </th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">
              Date
            </th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">
              Amount
            </th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">
              Earnings
            </th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">
              Payment Status
            </th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">
              Assign Order
            </th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <React.Fragment key={order.id}>
              <tr
                className="border-b border-border/50 hover:bg-muted/30 transition-colors"
              >
                <td className="py-3 px-4">
                  <span className="font-medium text-sm">#{order.id}</span>
                </td>
                <td className="py-3 px-4">
                  <span className="text-sm text-muted-foreground">
                    {order.user?.name || order.user?.email || "N/A"}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className="text-xs text-muted-foreground">
                    {order.address || "N/A"}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className="text-xs text-muted-foreground">
                    {formatDate(order.orderDate)}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className="font-medium text-sm">
                    ALL {order.totalAmount?.toFixed(2)}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className="font-medium text-sm text-green-600 dark:text-green-400">
                    ALL {order.deliveryEarnings ? order.deliveryEarnings.toFixed(2) : "0.00"}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <Badge className={getPaymentStatusColor(order.paymentStatus)}>
                    {order.paymentStatus}
                  </Badge>
                </td>
                <td className="py-3 px-4">
                  <Button
                    onClick={() => handleAssignOrder(order)}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 h-auto"
                    size="sm"
                  >
                    <UserCheck className="h-3 w-3 mr-1" />
                    Assign
                  </Button>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewOrderDetails(order)}
                      className="h-6 w-6 p-0"
                      title="View Details"
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    {order.latitude && order.longitude && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenMap(order.latitude, order.longitude)}
                        className="h-6 w-6 p-0"
                        title="Customer Location"
                      >
                        <MapPin className="h-3 w-3 text-green-600" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleFetchBranchLocation(order.id)}
                      className={`h-6 w-6 p-0 ${branchInfo?.orderId === order.id ? "bg-orange-100 dark:bg-orange-900/30" : ""}`}
                      title="Branch Location"
                      disabled={branchLoading === order.id}
                    >
                      {branchLoading === order.id ? (
                        <Loader2 className="h-3 w-3 animate-spin text-orange-600" />
                      ) : (
                        <Store className="h-3 w-3 text-orange-600" />
                      )}
                    </Button>
                  </div>
                </td>
              </tr>
              {/* Branch location info row */}
              {branchInfo?.orderId === order.id && (
                <tr className="bg-orange-50 dark:bg-orange-950/20 border-b border-border/50">
                  <td colSpan={9} className="py-2 px-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Store className="h-4 w-4 text-orange-600 flex-shrink-0" />
                        <div>
                          <span className="text-xs font-medium text-orange-700 dark:text-orange-400">
                            Pickup Branch:
                          </span>
                          <span className="text-xs text-muted-foreground ml-2">
                            {branchInfo.address || "N/A"}
                          </span>
                        </div>
                        {branchInfo.latitude && branchInfo.longitude && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenMap(branchInfo.latitude, branchInfo.longitude)}
                            className="h-6 px-2 text-xs text-orange-700 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/40"
                          >
                            <Navigation className="h-3 w-3 mr-1" />
                            Open in Maps
                          </Button>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setBranchInfo(null)}
                        className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DeliveryOrdersTable;

