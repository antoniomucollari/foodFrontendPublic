import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { orderAPI } from "../../services/api";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Search, RefreshCw } from "lucide-react";
import OrderDetailModal from "../admin/OrderDetailModal";
import OrdersTable from "../admin/OrdersTable";

const ManagerAllOrders = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [filters, setFilters] = useState({
        orderStatus: searchParams.get("orderStatus") || "",
        paymentStatus: searchParams.get("paymentStatus") || "",
        searchId: searchParams.get("searchId") || "",
        sortBy: searchParams.get("sortBy") || "",
        sortDirection: searchParams.get("sortDirection") || "desc",
        page: parseInt(searchParams.get("page")) || 0,
        size: parseInt(searchParams.get("size")) || 20,
    });
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const {
        data: ordersData,
        isLoading,
        refetch,
        error,
    } = useQuery({
        queryKey: ["manager-all-orders", filters],
        queryFn: () => orderAPI.getAllOrders(filters),
    });

    const orders = ordersData?.data?.data?.content || [];
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
            refetch();
        } catch (error) {
            console.error("Error updating order status:", error);
        }
    };

    return (
        <div className="space-y-6 p-6 w-full">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">All Orders</h1>
                    <p className="text-sm text-muted-foreground">
                        View and manage orders for your restaurant
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
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

                {/* Order Status Filter */}
                <select
                    value={filters.orderStatus}
                    onChange={(e) => handleFilterChange("orderStatus", e.target.value)}
                    className="px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm h-9 shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer"
                >
                    <option value="">All Order Status</option>
                    <option value="INITIALIZED">Initialized</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="PREPARING">Preparing</option>
                    <option value="READY_FOR_PICKUP">Ready for Pickup</option>
                    <option value="ON_THE_WAY">On The Way</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="FAILED">Failed</option>
                </select>

                {/* Payment Status Filter */}
                <select
                    value={filters.paymentStatus}
                    onChange={(e) => handleFilterChange("paymentStatus", e.target.value)}
                    className="px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm h-9 shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer"
                >
                    <option value="">All Payment Status</option>
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
                            <span>Loading orders...</span>
                        </div>
                    )}

                    {error && (
                        <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-4">
                            <p className="font-medium">Error loading orders:</p>
                            <p className="text-sm">{error.message}</p>
                        </div>
                    )}

                    {!isLoading && !error && orders.length === 0 && (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground">No orders found</p>
                        </div>
                    )}

                    {!isLoading && orders.length > 0 && (
                        <OrdersTable
                            orders={orders}
                            onUpdateOrderStatus={handleUpdateOrderStatus}
                            onViewOrderDetails={handleViewOrderDetails}
                            showStatusControls={true}
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

export default ManagerAllOrders;
