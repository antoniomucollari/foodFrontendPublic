import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { orderAPI, restaurantBranchAPI } from "../../services/api";
import { useWebSocket } from "../../services/websocket";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Search, RefreshCw, PackageCheck, Eye, MapPin } from "lucide-react";
import OrderDetailModal from "../admin/OrderDetailModal";

const BranchManagerDispatchBoard = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { isConnected, subscribe, unsubscribe } = useWebSocket();
    const [filters, setFilters] = useState({
        searchId: searchParams.get("searchId") || "",
        sortBy: searchParams.get("sortBy") || "",
        sortDirection: searchParams.get("sortDirection") || "desc",
        page: parseInt(searchParams.get("page")) || 0,
        size: parseInt(searchParams.get("size")) || 20,
    });
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Fetch branch details to get branchId for WebSocket topic
    const { data: branchData } = useQuery({
        queryKey: ["my-branch-details"],
        queryFn: () => restaurantBranchAPI.getMyBranchDetails(),
    });
    const branchId = branchData?.data?.data?.id;

    const {
        data: ordersData,
        isLoading,
        refetch,
        error,
    } = useQuery({
        queryKey: ["branch-manager-dispatch-board", filters],
        queryFn: () =>
            orderAPI.getAllOrders({
                ...filters,
                orderStatus: "READY_FOR_PICKUP",
            }),
    });

    // Seed local state from the HTTP query result
    useEffect(() => {
        if (ordersData?.data?.data?.content) {
            setOrders(ordersData.data.data.content);
        }
    }, [ordersData]);

    // WebSocket subscription for real-time updates
    // Subscribes to /topic/branch/{branchId}/manager (matches backend WebSocketController)
    useEffect(() => {
        if (!isConnected || !branchId) return;

        const topic = `/topic/branch.${branchId}.manager`;

        const handleOrderUpdate = (updated) => {
            console.log("[DispatchBoard] WS update:", updated.id, updated.orderStatus);

            // The backend sends the full OrderDTO to /topic/branch/{branchId}/manager
            // We intelligently decide whether to add/update/remove based on status
            setOrders((prev) => {
                const exists = prev.some((o) => o.id === updated.id);

                if (updated.orderStatus === "READY_FOR_PICKUP") {
                    if (exists) {
                        return prev.map((o) => (o.id === updated.id ? updated : o));
                    }
                    // Order became READY_FOR_PICKUP — add it
                    return [updated, ...prev];
                }
                // Order left READY_FOR_PICKUP — remove it
                return prev.filter((o) => o.id !== updated.id);
            });
        };

        subscribe(topic, handleOrderUpdate);
        return () => {
            unsubscribe(topic, handleOrderUpdate);
        };
    }, [isConnected, branchId]);

    const totalPages = ordersData?.data?.data?.totalPages || 0;
    const currentPage = ordersData?.data?.data?.number || 0;

    const handleFilterChange = (key, value) => {
        const newFilters = {
            ...filters,
            [key]: value,
            page: 0,
        };
        setFilters(newFilters);

        const newSearchParams = new URLSearchParams();
        Object.entries(newFilters).forEach(([filterKey, filterValue]) => {
            if (filterValue !== "" && filterValue !== 0) {
                newSearchParams.set(filterKey, filterValue.toString());
            }
        });
        setSearchParams(newSearchParams);
    };

    const handlePageChange = (newPage) => {
        const newFilters = {
            ...filters,
            page: newPage,
        };
        setFilters(newFilters);

        const newSearchParams = new URLSearchParams();
        Object.entries(newFilters).forEach(([filterKey, filterValue]) => {
            if (filterValue !== "" && filterValue !== 0) {
                newSearchParams.set(filterKey, filterValue.toString());
            }
        });
        setSearchParams(newSearchParams);
    };

    const handleViewOrderDetails = (order) => {
        setSelectedOrder(order);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedOrder(null);
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
            case "CANCELED":
                return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
            case "REFUNDED":
                return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
            case "TO_REFUND":
                return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
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
        <div className="space-y-6 p-6 w-full">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Dispatch Board</h1>
                    <p className="text-sm text-muted-foreground">
                        Orders ready for pickup by delivery
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Live indicator */}
                    <div className="flex items-center gap-1.5">
                        <div className="relative">
                            <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
                            {isConnected && (
                                <div className="absolute inset-0 w-2.5 h-2.5 bg-green-400 rounded-full animate-ping opacity-75" />
                            )}
                        </div>
                        <span className={`text-xs font-medium ${isConnected ? "text-green-600 dark:text-green-400" : "text-red-500"}`}>
                            {isConnected ? "Live" : "Offline"}
                        </span>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => refetch()}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Info Banner */}

                <div className="ml-auto flex-shrink-0">
                    {orders.length > 0 && (
                        <Badge className="bg-cyan-600 text-white text-sm px-3 py-1">
                            {orders.length} awaiting pickup
                        </Badge>
                    )}
                </div>

            {/* Search and Filters */}
            <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/30 rounded-lg">
                {/* Search by ID */}
                <div className="relative flex-1 min-w-[200px] max-w-xs">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by Order ID..."
                        value={filters.searchId}
                        onChange={(e) => handleFilterChange("searchId", e.target.value)}
                        className="pl-10 h-9"
                    />
                </div>

                {/* Sort By */}
                <select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                    className="px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm h-9 shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer"
                >
                    <option value="">Sort by: Default</option>
                    <option value="lastUpdated">Last Updated</option>
                    <option value="amount">Amount</option>
                    <option value="order_created_date">Order Date</option>
                    <option value="deliveryDate">Delivery Date</option>
                </select>

                {/* Sort Direction */}
                <select
                    value={filters.sortDirection}
                    onChange={(e) => handleFilterChange("sortDirection", e.target.value)}
                    className="px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm h-9 shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer"
                >
                    <option value="desc">Descending</option>
                    <option value="asc">Ascending</option>
                </select>

                {/* Results per page */}
                <select
                    value={filters.size}
                    onChange={(e) => handleFilterChange("size", parseInt(e.target.value))}
                    className="px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm h-9 shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer"
                >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                </select>
            </div>

            {/* Orders */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium">Orders</h2>
                    <span className="text-sm text-muted-foreground">
                        {orders.length} found
                    </span>
                </div>
                <div>
                    {isLoading && (
                        <div className="flex items-center justify-center py-8">
                            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                            <span>Loading dispatch orders...</span>
                        </div>
                    )}

                    {error && (
                        <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-4">
                            <p className="font-medium">Error loading orders:</p>
                            <p className="text-sm">{error.message}</p>
                        </div>
                    )}

                    {!isLoading && !error && orders.length === 0 && (
                        <div className="text-center py-12">
                            <PackageCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-lg font-medium text-foreground">No orders awaiting pickup</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Orders will appear here once they are ready for pickup.
                            </p>
                        </div>
                    )}

                    {!isLoading && orders.length > 0 && (
                        <>
                            {/* Desktop Table View */}
                            <div className="hidden md:block overflow-x-auto rounded-lg border border-border">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-border bg-muted/40">
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
                                                Status
                                            </th>
                                            <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">
                                                Payment
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
                                                    <Badge className="bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200">
                                                        Ready for Pickup
                                                    </Badge>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <Badge className={getPaymentStatusColor(order.paymentStatus)}>
                                                        {order.paymentStatus}
                                                    </Badge>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleViewOrderDetails(order)}
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
                                                    onClick={() => handleViewOrderDetails(order)}
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

                                        {/* Details */}
                                        <div className="space-y-2">
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
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-muted-foreground">Status</span>
                                                <Badge className="bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200">
                                                    Ready for Pickup
                                                </Badge>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-muted-foreground">Payment</span>
                                                <Badge className={getPaymentStatusColor(order.paymentStatus)}>
                                                    {order.paymentStatus}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                            <div className="text-sm text-muted-foreground">
                                Page {currentPage + 1} of {totalPages}
                            </div>
                            <div className="flex space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 0}
                                    className="h-8 px-3 text-xs"
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage >= totalPages - 1}
                                    className="h-8 px-3 text-xs"
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
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

export default BranchManagerDispatchBoard;
