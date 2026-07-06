import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { orderAPI } from "../../services/api";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Search, RefreshCw } from "lucide-react";
import OrderDetailModal from "../admin/OrderDetailModal";
import OrdersTable from "../admin/OrdersTable";
import FilterRadioDropdown from "../common/FilterRadioDropdown";

const BranchManagerAllOrders = () => {
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
    const orderStatusOptions = useMemo(
        () => [
            { label: "All Order Status", value: "" },
            { label: "Initialized", value: "INITIALIZED" },
            { label: "Confirmed", value: "CONFIRMED" },
            { label: "Preparing", value: "PREPARING" },
            { label: "Ready for Pickup", value: "READY_FOR_PICKUP" },
            { label: "On The Way", value: "ON_THE_WAY" },
            { label: "Delivered", value: "DELIVERED" },
            { label: "Cancelled", value: "CANCELLED" },
            { label: "Failed", value: "FAILED" },
        ],
        []
    );
    const paymentStatusOptions = useMemo(
        () => [
            { label: "All Payment Status", value: "" },
            { label: "Pending", value: "PENDING" },
            { label: "Pending Payment", value: "PENDING_PAYMENT" },
            { label: "Expired", value: "EXPIRED" },
            { label: "Abandoned", value: "ABANDONED" },
            { label: "Completed", value: "COMPLETED" },
            { label: "Rejected", value: "REJECTED" },
            { label: "Failed", value: "FAILED" },
            { label: "Refunded", value: "REFUNDED" },
            { label: "Canceled", value: "CANCELED" },
            { label: "To Refund", value: "TO_REFUND" },
        ],
        []
    );
    const sortByOptions = useMemo(
        () => [
            { label: "Sort by: Default", value: "" },
            { label: "Last Updated", value: "lastUpdated" },
            { label: "Amount", value: "amount" },
            { label: "Order Date", value: "order_created_date" },
            { label: "Delivery Date", value: "deliveryDate" },
        ],
        []
    );
    const sortDirectionOptions = useMemo(
        () => [
            { label: "Descending", value: "desc" },
            { label: "Ascending", value: "asc" },
        ],
        []
    );
    const pageSizeOptions = useMemo(
        () => [
            { label: "10", value: 10 },
            { label: "20", value: 20 },
            { label: "50", value: 50 },
            { label: "100", value: 100 },
        ],
        []
    );
    const orderStatusTriggerLabel =
        orderStatusOptions.find((option) => option.value === filters.orderStatus)?.label ||
        "All Order Status";
    const paymentStatusTriggerLabel =
        paymentStatusOptions.find((option) => option.value === filters.paymentStatus)?.label ||
        "All Payment Status";
    const sortByTriggerLabel =
        sortByOptions.find((option) => option.value === filters.sortBy)?.label ||
        "Sort by: Default";
    const sortDirectionTriggerLabel =
        sortDirectionOptions.find((option) => option.value === filters.sortDirection)?.label ||
        "Descending";
    const pageSizeTriggerLabel =
        pageSizeOptions.find((option) => option.value === filters.size)?.label || "20";

    const {
        data: ordersData,
        isLoading,
        refetch,
        error,
    } = useQuery({
        queryKey: ["branch-manager-all-orders", filters],
        queryFn: () => orderAPI.getAllOrders(filters),
    });

    const orders = ordersData?.data?.data?.content || [];
    const totalPages = ordersData?.data?.data?.totalPages || 0;
    const currentPage = ordersData?.data?.data?.number || 0;

    const handleFilterChange = (key, value) => {
        const newFilters = {
            ...filters,
            [key]: value,
            page: 0, // Reset to first page when filters change
        };
        setFilters(newFilters);

        // Update URL parameters
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

        // Update URL parameters
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
                        View and manage orders for your branch
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
                <FilterRadioDropdown
                    triggerLabel={orderStatusTriggerLabel}
                    panelTitle="Order Status"
                    value={filters.orderStatus}
                    options={orderStatusOptions}
                    onChange={(value) => handleFilterChange("orderStatus", value)}
                    onReset={() => handleFilterChange("orderStatus", "")}
                />

                {/* Payment Status Filter */}
                <FilterRadioDropdown
                    triggerLabel={paymentStatusTriggerLabel}
                    panelTitle="Payment Status"
                    value={filters.paymentStatus}
                    options={paymentStatusOptions}
                    onChange={(value) => handleFilterChange("paymentStatus", value)}
                    onReset={() => handleFilterChange("paymentStatus", "")}
                />

                {/* Sort By */}
                <FilterRadioDropdown
                    triggerLabel={sortByTriggerLabel}
                    panelTitle="Sort"
                    value={filters.sortBy}
                    options={sortByOptions}
                    onChange={(value) => handleFilterChange("sortBy", value)}
                    onReset={() => handleFilterChange("sortBy", "")}
                />

                {/* Sort Direction */}
                <FilterRadioDropdown
                    triggerLabel={sortDirectionTriggerLabel}
                    panelTitle="Direction"
                    value={filters.sortDirection}
                    options={sortDirectionOptions}
                    onChange={(value) => handleFilterChange("sortDirection", value)}
                    onReset={() => handleFilterChange("sortDirection", "desc")}
                />

                {/* Results per page */}
                <FilterRadioDropdown
                    triggerLabel={pageSizeTriggerLabel}
                    panelTitle="Results per page"
                    value={filters.size}
                    options={pageSizeOptions}
                    onChange={(value) => handleFilterChange("size", value)}
                    showReset={false}
                />
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

export default BranchManagerAllOrders;
