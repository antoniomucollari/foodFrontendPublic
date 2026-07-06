import React, { useState } from "react";
import { Button } from "../ui/button";

import { Eye, MapPin, Store, X, Navigation, Loader2 } from "lucide-react";
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
import { restaurantBranchAPI } from "../../services/api";

const DeliveryToDeliverTable = ({
    orders,
    onUpdateOrderStatus,
    onViewOrderDetails,
    showStatusControls = true,
}) => {
    const [branchInfo, setBranchInfo] = useState(null);
    const [branchLoading, setBranchLoading] = useState(null);
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




    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const month = date.toLocaleDateString("en-US", { month: "short" });
        const day = date.getDate();
        const hours = date.getHours().toString().padStart(2, "0");
        const minutes = date.getMinutes().toString().padStart(2, "0");
        return `${month} ${day}, ${hours}:${minutes}`;
    };

    const handleOpenMap = (lat, lng) => {
        if (lat && lng) {
            const url = `https://www.google.com/maps?q=${lat},${lng}`;
            window.open(url, "_blank");
        }
    };

    const handleFetchBranchLocation = async (orderId) => {
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

                        {showStatusControls && (
                            <>
                                <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">
                                    Update Status
                                </th>
                                <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">
                                    Update Payment
                                </th>
                            </>
                        )}
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map((order) => (
                        <React.Fragment key={order.id}>
                            <tr className="border-b border-border/50 hover:bg-muted/30 transition-colors">
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

                                {showStatusControls && (
                                    <>
                                        <td className="py-3 px-4">
                                            <select
                                                value={order.orderStatus || ""}
                                                onChange={(e) =>
                                                    handleStatusChangeAttempt(
                                                        order.id,
                                                        e.target.value,
                                                        "orderStatus"
                                                    )
                                                }
                                                className="w-full px-2 py-1 border border-input rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground shadow-sm cursor-pointer"
                                            >
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
                                            </select>
                                        </td>
                                        <td className="py-3 px-4">
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
                                                className={`w-full px-2 py-1 border border-input rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground shadow-sm ${order.paymentMethod !== "CASH_ON_DELIVERY" ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
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
                                        </td>
                                    </>
                                )}
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
                                                onClick={() =>
                                                    handleOpenMap(order.latitude, order.longitude)
                                                }
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
                                            className={`h-6 w-6 p-0 ${branchInfo?.orderId === order.id
                                                ? "bg-orange-100 dark:bg-orange-900/30"
                                                : ""
                                                }`}
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
                                    <td
                                        colSpan={showStatusControls ? 8 : 6}
                                        className="py-2 px-4"
                                    >
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
                                                        onClick={() =>
                                                            handleOpenMap(
                                                                branchInfo.latitude,
                                                                branchInfo.longitude
                                                            )
                                                        }
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
        </div>
    );
};

export default DeliveryToDeliverTable;
