import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { orderAPI, restaurantBranchAPI } from "../../services/api";
import { useWebSocket } from "../../services/websocket";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Search, RefreshCw, ChefHat } from "lucide-react";
import OrderDetailModal from "../admin/OrderDetailModal";
import OrdersTable from "../admin/OrdersTable";

const BranchManagerPreparationQueue = () => {
    const queryClient = useQueryClient();
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

    const ACTIVE_STATUSES = ["CONFIRMED", "PREPARING"];

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
        queryKey: ["branch-manager-preparation-queue", filters],
        queryFn: () =>
            orderAPI.getAllOrders({
                ...filters,
                orderStatus: ACTIVE_STATUSES,
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
            console.log("[PreparationQueue] WS update:", updated.id, updated.orderStatus);

            // The backend sends the full OrderDTO to /topic/branch/{branchId}/manager
            // We intelligently decide whether to add/update/remove based on status
            setOrders((prev) => {
                const exists = prev.some((o) => o.id === updated.id);

                if (ACTIVE_STATUSES.includes(updated.orderStatus)) {
                    if (exists) {
                        return prev.map((o) => (o.id === updated.id ? updated : o));
                    }
                    // New order became active — add it
                    return [updated, ...prev];
                }
                // Order left active statuses — remove it
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

    const handleUpdateOrderStatus = async (orderId, newStatus, statusType) => {
        try {
            const updateData = { id: orderId };
            if (statusType === "orderStatus") {
                updateData.orderStatus = newStatus;
            } else if (statusType === "paymentStatus") {
                updateData.paymentStatus = newStatus;
            }

            await orderAPI.updateOrderStatus(updateData);

            // Optimistically update/remove from local state
            if (statusType === "orderStatus" && !ACTIVE_STATUSES.includes(newStatus)) {
                setOrders((prev) => prev.filter((o) => o.id !== orderId));
            }

            queryClient.invalidateQueries(["branch-manager-preparation-queue"]);
        } catch (error) {
            console.error("Error updating order status:", error);
        }
    };

    const confirmedCount = orders.filter((o) => o.orderStatus === "CONFIRMED").length;
    const preparingCount = orders.filter((o) => o.orderStatus === "PREPARING").length;

    return (
        <div className="space-y-6 p-6 w-full">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Preparation Queue</h1>
                    <p className="text-sm text-muted-foreground">
                        Active orders being confirmed and prepared
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


                <div className="ml-auto flex-shrink-0 flex items-center gap-2">
                    {confirmedCount > 0 && (
                        <Badge className="bg-blue-600 text-white text-sm px-3 py-1">
                            {confirmedCount} confirmed
                        </Badge>
                    )}
                    {preparingCount > 0 && (
                        <Badge className="bg-orange-600 text-white text-sm px-3 py-1">
                            {preparingCount} preparing
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

            {/* Orders List */}
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
                            <span>Loading active orders...</span>
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
                            <ChefHat className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-lg font-medium text-foreground">No active orders</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                No orders are currently being prepared.
                            </p>
                        </div>
                    )}

                    {!isLoading && orders.length > 0 && (
                        <OrdersTable
                            orders={orders}
                            onUpdateOrderStatus={handleUpdateOrderStatus}
                            onViewOrderDetails={handleViewOrderDetails}
                            showStatusControls={true}
                            branchManagerMode={true}
                        />
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

export default BranchManagerPreparationQueue;
