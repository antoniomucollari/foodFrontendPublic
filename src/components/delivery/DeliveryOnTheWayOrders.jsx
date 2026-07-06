import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { orderAPI, userAPI } from "../../services/api";
import { getPageContent } from "../../utils/apiResponse";
import { useWebSocket } from "../../services/websocket";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Search, RefreshCw, User, X, Truck } from "lucide-react";
import OrderDetailModal from "../admin/OrderDetailModal";
import DeliveryToDeliverTable from "./DeliveryToDeliverTable";
import ServerErrorDisplay from "../ui/server-error-display";
import useServerError from "../../hooks/useServerError";

const DeliveryOnTheWayOrders = () => {
    const userLookupPageSize = 2000;
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const { serverError, handleError, clearError } = useServerError();
    const { isConnected, subscribe, unsubscribe } = useWebSocket();
    const [orders, setOrders] = useState([]);
    const [filters, setFilters] = useState({
        orderStatus: "ON_THE_WAY", // Always fixed to ON_THE_WAY
        paymentStatus: searchParams.get("paymentStatus") || "",
        searchId: searchParams.get("searchId") || "",
        customerId: searchParams.get("customerId") || "",
        sortBy: searchParams.get("sortBy") || "",
        sortDirection: searchParams.get("sortDirection") || "desc",
        page: parseInt(searchParams.get("page")) || 0,
        size: parseInt(searchParams.get("size")) || 20,
    });
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [customerSearch, setCustomerSearch] = useState("");
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

    // Customer search query
    const { data: customersData, isLoading: isLoadingCustomers } = useQuery({
        queryKey: ["customers", customerSearch],
        queryFn: () =>
            userAPI.getAllUsers("CUSTOMER", customerSearch, { size: userLookupPageSize }),
        enabled: customerSearch.length > 2,
    });

    // Fetch all customers for initial load when customerId is in URL
    const { data: allCustomersData, isLoading: isLoadingAllCustomers } = useQuery({
        queryKey: ["all-customers"],
        queryFn: () => userAPI.getAllUsers("CUSTOMER", "", { size: userLookupPageSize }),
        enabled: Boolean(filters.customerId && !selectedCustomer),
    });

    const {
        data: ordersData,
        isLoading,
        refetch,
        error,
    } = useQuery({
        queryKey: ["delivery-on-the-way-orders", filters],
        queryFn: () => {
            console.log("DeliveryOnTheWayOrders - Making API call with filters:", filters);
            return orderAPI.getAllOrders({ ...filters, orderStatus: "ON_THE_WAY" });
        },
        enabled: !!user?.id,
    });

    // Handle server errors
    if (error && !serverError) {
        handleError(error);
    }

    // Seed local state from the HTTP query result
    useEffect(() => {
        const fetched = ordersData?.data?.data?.content;
        if (fetched) {
            setOrders(fetched);
        }
    }, [ordersData]);

    // WebSocket subscription for personal delivery updates
    useEffect(() => {
        if (!isConnected || !user?.id) return;

        const handlePersonalUpdate = (updated) => {
            console.log("[DeliveryOnTheWayOrders] WS personal update:", updated.id, updated.orderStatus);
            setOrders((prev) => {
                const exists = prev.some((o) => o.id === updated.id);
                if (updated.orderStatus === "ON_THE_WAY") {
                    if (exists) {
                        return prev.map((o) => (o.id === updated.id ? updated : o));
                    }
                    return [updated, ...prev];
                }
                // Order left ON_THE_WAY — remove it
                return prev.filter((o) => o.id !== updated.id);
            });
        };

        subscribe("/user/queue/updates", handlePersonalUpdate);
        return () => {
            unsubscribe("/user/queue/updates", handlePersonalUpdate);
        };
    }, [isConnected, user?.id]);

    const totalPages = ordersData?.data?.data?.totalPages || 0;
    const currentPage = ordersData?.data?.data?.number || 0;
    const customers = getPageContent(customersData);

    const handleFilterChange = (key, value) => {
        const newFilters = {
            ...filters,
            [key]: value,
            page: 0,
        };
        setFilters(newFilters);

        const newSearchParams = new URLSearchParams();
        Object.entries(newFilters).forEach(([filterKey, filterValue]) => {
            if (filterValue !== "" && filterValue !== 0 && filterKey !== "orderStatus") {
                newSearchParams.set(filterKey, filterValue.toString());
            }
        });
        setSearchParams(newSearchParams);
    };

    const handlePageChange = (newPage) => {
        const newFilters = { ...filters, page: newPage };
        setFilters(newFilters);

        const newSearchParams = new URLSearchParams();
        Object.entries(newFilters).forEach(([filterKey, filterValue]) => {
            if (filterValue !== "" && filterValue !== 0 && filterKey !== "orderStatus") {
                newSearchParams.set(filterKey, filterValue.toString());
            }
        });
        setSearchParams(newSearchParams);
    };

    const handleCustomerSelect = (customer) => {
        setSelectedCustomer(customer);
        setCustomerSearch(customer.name);
        setShowCustomerDropdown(false);
        handleFilterChange("customerId", customer.id);
    };

    const handleCustomerSearchChange = (value) => {
        setCustomerSearch(value);
        setShowCustomerDropdown(value.length > 2);
        if (value === "") {
            setSelectedCustomer(null);
            handleFilterChange("customerId", "");
        }
    };

    const clearCustomerFilter = () => {
        setSelectedCustomer(null);
        setCustomerSearch("");
        setShowCustomerDropdown(false);
        handleFilterChange("customerId", "");
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

    // Initialize customer search from URL parameters
    useEffect(() => {
        if (filters.customerId && !selectedCustomer && getPageContent(allCustomersData).length > 0) {
            const allCustomers = getPageContent(allCustomersData);
            const customer = allCustomers.find((c) => c.id === parseInt(filters.customerId));
            if (customer) {
                setSelectedCustomer(customer);
                setCustomerSearch(customer.name);
            } else {
                setCustomerSearch(`Customer ID: ${filters.customerId}`);
            }
        }
    }, [filters.customerId, selectedCustomer, allCustomersData]);

    // Close customer dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showCustomerDropdown && !event.target.closest(".customer-search-container")) {
                setShowCustomerDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showCustomerDropdown]);

    return (
        <div className="space-y-6 p-6 w-full">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">On the way</h1>
                    <p className="text-sm text-muted-foreground">
                        Orders assigned to you with status "ON_THE_WAY"
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => refetch()}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Server Error Display */}
            {serverError && (
                <ServerErrorDisplay
                    error={serverError}
                    onRetry={() => {
                        clearError();
                        refetch();
                    }}
                    onDismiss={clearError}
                    showDismissButton={true}
                    title="On the way Error"
                />
            )}

            {/* Info Card */}
            <Card className="border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950">
                <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                        <Truck className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        <div>
                            <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                                On the way
                            </p>
                            <p className="text-xs text-purple-700 dark:text-purple-300">
                                This page shows orders currently on the way to the customer (status: ON_THE_WAY).
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

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

                {/* Customer Search */}
                <div className="customer-search-container relative flex-1 min-w-[200px] max-w-xs">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={isLoadingAllCustomers ? "Loading customer..." : "Search by Customer..."}
                        value={customerSearch}
                        onChange={(e) => handleCustomerSearchChange(e.target.value)}
                        onFocus={() => setShowCustomerDropdown(customerSearch.length > 2)}
                        className="pl-10 pr-8 h-9"
                        disabled={isLoadingAllCustomers}
                    />
                    {selectedCustomer && (
                        <button
                            onClick={clearCustomerFilter}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}

                    {/* Customer Dropdown */}
                    {showCustomerDropdown && customers.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                            {customers.map((customer) => (
                                <button
                                    key={customer.id}
                                    onClick={() => handleCustomerSelect(customer)}
                                    className="w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground text-sm"
                                >
                                    {customer.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

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
                    <h2 className="text-lg font-medium">On the way</h2>
                    <span className="text-sm text-muted-foreground">
                        {orders.length} orders found
                    </span>
                </div>
                <div>
                    {isLoading && (
                        <div className="flex items-center justify-center py-8">
                            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                            <span>Loading on-the-way orders...</span>
                        </div>
                    )}

                    {error && !serverError && (
                        <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-4">
                            <p className="font-medium">Error loading orders:</p>
                            <p className="text-sm">{error.message}</p>
                        </div>
                    )}

                    {!isLoading && !error && orders.length === 0 && (
                        <div className="text-center py-8">
                            <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">No orders currently on the way</p>
                            <p className="text-sm text-muted-foreground mt-2">
                                There are no orders with status ON_THE_WAY at the moment.
                            </p>
                        </div>
                    )}

                    {!isLoading && orders.length > 0 && (
                        <DeliveryToDeliverTable
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

export default DeliveryOnTheWayOrders;
