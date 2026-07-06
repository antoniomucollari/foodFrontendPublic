import React, { useState } from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Eye, MapPin } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";

const OrdersTable = ({
  orders,
  onUpdateOrderStatus,
  onViewOrderDetails,
  showStatusControls = true,
  deliveryMode = false,
  branchManagerMode = false,
}) => {
  const [pendingConfirm, setPendingConfirm] = useState(null);

  const handleStatusChangeAttempt = (orderId, value, type) => {
    if (value === "FAILED") {
      setPendingConfirm({ orderId, value, type });
    } else {
      onUpdateOrderStatus(orderId, value, type);
    }
  };

  const confirmStatusChange = () => {
    if (pendingConfirm) {
      onUpdateOrderStatus(pendingConfirm.orderId, pendingConfirm.value, pendingConfirm.type);
      setPendingConfirm(null);
    }
  };

  const getOrderStatusColor = (status) => {
    switch (status) {
      case "INITIALIZED":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "CONFIRMED":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "PREPARING":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "READY_FOR_PICKUP":
        return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200";
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
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateShort = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleOpenMap = (deliveryLocation) => {
    if (
      deliveryLocation &&
      deliveryLocation.latitude &&
      deliveryLocation.longitude
    ) {
      const url = `https://www.google.com/maps?q=${deliveryLocation.latitude},${deliveryLocation.longitude}`;
      window.open(url, "_blank");
    }
  };

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
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
                Date
              </th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">
                Amount
              </th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">
                Order Status
              </th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">
                Payment Status
              </th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr
                key={order.id}
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
                    {formatDate(order.orderDate)}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className="font-medium text-sm">
                    ALL {order.totalAmount?.toFixed(2)}
                  </span>
                </td>
                <td className="py-3 px-4">
                  {showStatusControls ? (
                    <select
                      value={order.orderStatus || ""}
                      onChange={(e) =>
                        handleStatusChangeAttempt(
                          order.id,
                          e.target.value,
                          "orderStatus"
                        )
                      }
                      className="text-xs px-2 py-1 border border-border rounded-lg bg-background text-foreground min-w-[120px] shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer"
                    >
                      {deliveryMode ? (
                        <>
                          {/* Show current status, disabled to prevent self-selection */}
                          {order.orderStatus === "READY_FOR_PICKUP" ? (
                            <option value={order.orderStatus} disabled>Ready for Pickup</option>
                          ) : order.orderStatus === "ON_THE_WAY" ? (
                            <option value={order.orderStatus} disabled>On the way</option>
                          ) : (
                            <option value={order.orderStatus} disabled>{order.orderStatus?.replace(/_/g, " ")} (current)</option>
                          )}

                          {order.orderStatus === "READY_FOR_PICKUP" && (
                            <>
                              <option value="ON_THE_WAY">On the way</option>
                              <option value="FAILED">Failed</option>
                            </>
                          )}

                          {order.orderStatus === "ON_THE_WAY" && (
                            <>
                              <option value="DELIVERED">Delivered</option>
                              <option value="FAILED">Failed</option>
                            </>
                          )}

                          {/* Fallback for other arbitrary statuses */}
                          {(!["READY_FOR_PICKUP", "ON_THE_WAY"].includes(order.orderStatus)) && (
                            <>
                              <option value="ON_THE_WAY">On the way</option>
                              <option value="DELIVERED">Delivered</option>
                              <option value="FAILED">Failed</option>
                            </>
                          )}
                        </>
                      ) : branchManagerMode ? (
                        <>
                          {/* Branch Manager: show current status disabled, then only allowed transitions */}
                          {!["PREPARING", "READY_FOR_PICKUP", "FAILED"].includes(order.orderStatus) && (
                            <option value={order.orderStatus} disabled>{order.orderStatus?.replace(/_/g, " ")} (current)</option>
                          )}
                          <option value="PREPARING">Preparing</option>
                          <option value="READY_FOR_PICKUP">Ready for Pickup</option>
                          <option value="FAILED">Failed</option>
                        </>
                      ) : (
                        <>
                          <option value="INITIALIZED">Initialized</option>
                          <option value="CONFIRMED">Confirmed</option>
                          <option value="PREPARING">Preparing</option>
                          <option value="READY_FOR_PICKUP">Ready for Pickup</option>
                          <option value="ON_THE_WAY">On the way</option>
                          <option value="DELIVERED">Delivered</option>
                          <option value="CANCELLED">Cancelled</option>
                          <option value="FAILED">Failed</option>
                        </>
                      )}
                    </select>
                  ) : (
                    <Badge className={getOrderStatusColor(order.orderStatus)}>
                      {order.orderStatus}
                    </Badge>
                  )}
                </td>
                <td className="py-3 px-4">
                  {showStatusControls && !deliveryMode ? (
                    <select
                      value={order.paymentStatus || ""}
                      onChange={(e) =>
                        handleStatusChangeAttempt(
                          order.id,
                          e.target.value,
                          "paymentStatus"
                        )
                      }
                      className="text-xs px-2 py-1 border border-border rounded-lg bg-background text-foreground min-w-[120px] shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer"
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
                  ) : showStatusControls && deliveryMode ? (
                    <select
                      value={order.paymentStatus || ""}
                      onChange={(e) =>
                        handleStatusChangeAttempt(
                          order.id,
                          e.target.value,
                          "paymentStatus"
                        )
                      }
                      disabled={order.paymentMethod !== "CASH_ON_DELIVERY"}
                      title={order.paymentMethod !== "CASH_ON_DELIVERY" ? "Only available for Cash on Delivery" : ""}
                      className={`text-xs px-2 py-1 border border-border rounded-lg bg-background text-foreground min-w-[120px] shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${order.paymentMethod !== "CASH_ON_DELIVERY" ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:shadow-md"}`}
                    >
                      {/* Show current status if it's outside the allowed set */}
                      {!["COMPLETED", "FAILED"].includes(order.paymentStatus) && (
                        <option value={order.paymentStatus} disabled>
                          {order.paymentStatus} (current)
                        </option>
                      )}
                      <option value="COMPLETED">Completed</option>
                      <option value="FAILED">Failed</option>
                    </select>
                  ) : (
                    <Badge
                      className={getPaymentStatusColor(order.paymentStatus)}
                    >
                      {order.paymentStatus}
                    </Badge>
                  )}
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
                    {order.deliveryLocation && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenMap(order.deliveryLocation)}
                        className="h-6 w-6 p-0"
                        title="Open in Maps"
                      >
                        <MapPin className="h-3 w-3 text-green-600" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {orders.map((order) => (
          <div
            key={order.id}
            className="border border-border rounded-lg p-4 bg-card hover:bg-muted/30 transition-colors"
          >
            {/* Header Row */}
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-sm">#{order.id}</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewOrderDetails(order)}
                  className="h-8 w-8 p-0"
                  title="View Details"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                {order.deliveryLocation && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenMap(order.deliveryLocation)}
                    className="h-8 w-8 p-0"
                    title="Open in Maps"
                  >
                    <MapPin className="h-4 w-4 text-green-600" />
                  </Button>
                )}
              </div>
            </div>

            {/* Customer and Date */}
            <div className="space-y-2 mb-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Customer</span>
                <span className="text-sm font-medium">
                  {order.user?.name || order.user?.email || "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Date</span>
                <span className="text-xs text-muted-foreground">
                  {formatDateShort(order.orderDate)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Amount</span>
                <span className="font-semibold text-sm">
                  ALL {order.totalAmount?.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Status Controls */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">
                  Order Status
                </span>
                {showStatusControls ? (
                  <select
                    value={order.orderStatus || ""}
                    onChange={(e) =>
                      handleStatusChangeAttempt(
                        order.id,
                        e.target.value,
                        "orderStatus"
                      )
                    }
                    className="text-xs px-2 py-1 border border-border rounded bg-background text-foreground w-32 shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {deliveryMode ? (
                      <>
                        {/* Show current status, disabled to prevent self-selection */}
                        {order.orderStatus === "READY_FOR_PICKUP" ? (
                          <option value={order.orderStatus} disabled>Ready for Pickup</option>
                        ) : order.orderStatus === "ON_THE_WAY" ? (
                          <option value={order.orderStatus} disabled>On the way</option>
                        ) : (
                          <option value={order.orderStatus} disabled>{order.orderStatus?.replace(/_/g, " ")} (current)</option>
                        )}

                        {order.orderStatus === "READY_FOR_PICKUP" && (
                          <>
                            <option value="ON_THE_WAY">On the way</option>
                            <option value="FAILED">Failed</option>
                          </>
                        )}

                        {order.orderStatus === "ON_THE_WAY" && (
                          <>
                            <option value="DELIVERED">Delivered</option>
                            <option value="FAILED">Failed</option>
                          </>
                        )}

                        {/* Fallback for other arbitrary statuses */}
                        {(!["READY_FOR_PICKUP", "ON_THE_WAY"].includes(order.orderStatus)) && (
                          <>
                            <option value="ON_THE_WAY">On the way</option>
                            <option value="DELIVERED">Delivered</option>
                            <option value="FAILED">Failed</option>
                          </>
                        )}
                      </>
                    ) : branchManagerMode ? (
                      <>
                        {!["PREPARING", "READY_FOR_PICKUP", "FAILED"].includes(order.orderStatus) && (
                          <option value={order.orderStatus} disabled>{order.orderStatus?.replace(/_/g, " ")} (current)</option>
                        )}
                        <option value="PREPARING">Preparing</option>
                        <option value="READY_FOR_PICKUP">Ready for Pickup</option>
                        <option value="FAILED">Failed</option>
                      </>
                    ) : (
                      <>
                        <option value="INITIALIZED">Initialized</option>
                        <option value="CONFIRMED">Confirmed</option>
                        <option value="PREPARING">Preparing</option>
                        <option value="READY_FOR_PICKUP">Ready for Pickup</option>
                        <option value="ON_THE_WAY">On the way</option>
                        <option value="DELIVERED">Delivered</option>
                        <option value="CANCELLED">Cancelled</option>
                        <option value="FAILED">Failed</option>
                      </>
                    )}
                  </select>
                ) : (
                  <Badge className={getOrderStatusColor(order.orderStatus)}>
                    {order.orderStatus}
                  </Badge>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Payment</span>
                {showStatusControls && !deliveryMode ? (
                  <select
                    value={order.paymentStatus || ""}
                    onChange={(e) =>
                      handleStatusChangeAttempt(
                        order.id,
                        e.target.value,
                        "paymentStatus"
                      )
                    }
                    className="text-xs px-2 py-1 border border-border rounded bg-background text-foreground w-32 shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
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
                ) : showStatusControls && deliveryMode ? (
                  <select
                    value={order.paymentStatus || ""}
                    onChange={(e) =>
                      handleStatusChangeAttempt(
                        order.id,
                        e.target.value,
                        "paymentStatus"
                      )
                    }
                    disabled={order.paymentMethod !== "CASH_ON_DELIVERY"}
                    title={order.paymentMethod !== "CASH_ON_DELIVERY" ? "Only available for Cash on Delivery" : ""}
                    className={`text-xs px-2 py-1 border border-border rounded bg-background text-foreground w-32 shadow-sm focus:outline-none focus:ring-1 focus:ring-primary ${order.paymentMethod !== "CASH_ON_DELIVERY" ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    {/* Show current status if it's outside the allowed set */}
                    {!["COMPLETED", "FAILED"].includes(order.paymentStatus) && (
                      <option value={order.paymentStatus} disabled>
                        {order.paymentStatus} (current)
                      </option>
                    )}
                    <option value="COMPLETED">Completed</option>
                    <option value="FAILED">Failed</option>
                  </select>
                ) : (
                  <Badge className={getPaymentStatusColor(order.paymentStatus)}>
                    {order.paymentStatus}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <AlertDialog open={!!pendingConfirm} onOpenChange={() => setPendingConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to set {pendingConfirm?.type === "orderStatus" ? "the order status" : "the payment status"} to <strong className="text-red-600">FAILED</strong>.
              <br /><br />
              <b>Warning:</b> If either the order or the payment status is set to FAILED, both will automatically become FAILED. This action cannot be easily undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmStatusChange}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Yes, fail order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default OrdersTable;
