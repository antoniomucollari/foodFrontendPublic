import React, { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { orderAPI, cartAPI } from "../services/api";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
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
  ReceiptText,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  ArrowLeft,
  Star,
  MapPin,
  RotateCcw,
  MessageSquare,
  Ban,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
} from "lucide-react";
import { Link } from "react-router-dom";
import ReviewModal from "../components/ReviewModal";
import PaymentDetailsModal from "../components/PaymentDetailsModal";
import FilterRadioDropdown from "../components/common/FilterRadioDropdown";
import {useTheme} from "@/contexts/ThemeContext.jsx";

const ORDER_STATUSES = [
  "INITIALIZED",
  "CONFIRMED",
  "ON_THE_WAY",
  "DELIVERED",
  "CANCELLED",
  "FAILED",
];

const PAYMENT_STATUSES = [
  "PENDING",
  "REJECTED",
  "COMPLETED",
  "FAILED",
  "REFUNDED",
  "PENDING_PAYMENT",
  "CANCELED",
  "TO_REFUND",
  "EXPIRED",
  "ABANDONED",
];


const SORT_BY_OPTIONS = [
  { value: "default", label: "Default" },
  { value: "orderDate", label: "Order Date" },
  { value: "totalAmount", label: "Total Amount" },
  { value: "id", label: "Order ID" },
];
const SORT_DIRECTION_OPTIONS = [
  { value: "asc", label: "Ascending" },
  { value: "desc", label: "Descending" },
];

const Orders = () => {
  const { theme } = useTheme();
  const [page, setPage] = React.useState(0);
  const [size] = React.useState(10);

  // Filter state
  const [orderId, setOrderId] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [sortDirection, setSortDirection] = useState("desc");
  const [selectedOrderStatuses, setSelectedOrderStatuses] = useState([]);
  const [selectedPaymentStatuses, setSelectedPaymentStatuses] = useState([]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Applied filters (only sent after user applies)
  const [appliedFilters, setAppliedFilters] = useState({});

  const [reviewModalOpen, setReviewModalOpen] = React.useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = React.useState(false);
  const [selectedOrder, setSelectedOrder] = React.useState(null);
  const [selectedPaymentOrder, setSelectedPaymentOrder] = React.useState(null);
  const [cancellingOrderId, setCancellingOrderId] = React.useState(null);

  const buildQueryParams = useCallback(
    (filters = appliedFilters) => {
      const params = { page, size };
      if (filters.orderId) params.searchId = String(filters.orderId);
      if (filters.sortBy && filters.sortBy !== "default") params.sortBy = filters.sortBy;
      if (filters.sortDirection) params.sortDirection = filters.sortDirection;
      if (filters.orderStatuses && filters.orderStatuses.length > 0)
        params.orderStatus = filters.orderStatuses;
      if (filters.paymentStatuses && filters.paymentStatuses.length > 0)
        params.paymentStatus = filters.paymentStatuses;
      return params;
    },
    [page, size, appliedFilters]
  );

  const {
    data: ordersData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["orders", page, size, appliedFilters],
    queryFn: () => orderAPI.getAllOrders(buildQueryParams()),
  });

  const handleApplyFilters = () => {
    setPage(0);
    setAppliedFilters({
      orderId,
      sortBy,
      sortDirection,
      orderStatuses: selectedOrderStatuses,
      paymentStatuses: selectedPaymentStatuses,
    });
  };

  const handleClearFilters = () => {
    setOrderId("");
    setSortBy("default");
    setSortDirection("desc");
    setSelectedOrderStatuses([]);
    setSelectedPaymentStatuses([]);
    setAppliedFilters({});
    setPage(0);
  };

  const toggleOrderStatus = (status) => {
    setSelectedOrderStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  const togglePaymentStatus = (status) => {
    setSelectedPaymentStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  const hasActiveFilters =
    appliedFilters.orderId ||
    (appliedFilters.sortBy && appliedFilters.sortBy !== "default") ||
    (appliedFilters.orderStatuses && appliedFilters.orderStatuses.length > 0) ||
    (appliedFilters.paymentStatuses && appliedFilters.paymentStatuses.length > 0);

  const getOrderStatusIcon = (status) => {
    switch (status) {
      case "INITIALIZED":
        return <Clock className="h-4 w-4 text-gray-500" />;
      case "CONFIRMED":
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case "ON_THE_WAY":
        return <Truck className="h-4 w-4 text-purple-500" />;
      case "DELIVERED":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "CANCELLED":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "FAILED":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
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
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const canReview = (order) => {
    return order.orderStatus === "DELIVERED";
  };

  const canCancel = (order) => {
    return (
      order.orderStatus !== "DELIVERED" &&
      order.orderStatus !== "CANCELLED" &&
      order.orderStatus !== "FAILED"
    );
  };

  const handleReviewClick = (order) => {
    setSelectedOrder(order);
    setReviewModalOpen(true);
  };

  const handlePaymentDetailsClick = (order) => {
    setSelectedPaymentOrder(order);
    setPaymentModalOpen(true);
  };

  const handleCancelOrder = async (order) => {
    if (!window.confirm(`Are you sure you want to cancel Order #${order.id}?`)) return;
    setCancellingOrderId(order.id);
    try {
      await orderAPI.updateOrderStatus({ id: order.id, orderStatus: "CANCELLED" });
      refetch();
    } catch (error) {
      console.error("Cancel order failed:", error);
      toast.error(error.response?.data?.message || "Failed to cancel order. Please try again.");
    } finally {
      setCancellingOrderId(null);
    }
  };

  const handleAskForRefund = async (order) => {
    if (!window.confirm(`Request a refund for Order #${order.id}?`)) return;
    try {
      await orderAPI.refundOrder(order.id);
      refetch();
    } catch (error) {
      console.error("Refund request failed:", error);
      toast.error(error.response?.data?.message || "Failed to request refund. Please try again.");
    }
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

  const navigate = useNavigate();

  const handleOrderAgain = async (order) => {
    try {
      const response = await cartAPI.orderAgain(order.id);
      const branchId = response.data?.data || response.data;
      toast.success("Items from your previous order have been added to your cart!");
      navigate(`/restaurant-branch/${branchId}`);
    } catch (error) {
      console.error("Order again failed:", error);
      toast.error(error.response?.data?.message || "Failed to re-order items. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 text-lg">Error loading orders</p>
      </div>
    );
  }

  const orders = ordersData?.data?.data?.content || [];
  const meta = ordersData?.data?.data;
  const isLast = meta?.last;
  const isFirst = meta?.first;
  const totalPages = meta?.totalPages;
  const totalElements = meta?.totalElements;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">My Orders</h1>
        <Button variant="link" asChild>
          <Link to="/discovery" className="flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Discovery
          </Link>
        </Button>
      </div>

      {/* Filter Panel */}
      <Card className="border border-border/60">
        <CardHeader
          className="pb-3 cursor-pointer select-none"
          onClick={() => setFiltersOpen((v) => !v)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-primary" />
              <span className="font-semibold text-base">Filters</span>
              {hasActiveFilters && (
                <Badge className="bg-primary text-primary-foreground text-xs px-2 py-0.5 ml-1">
                  Active
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClearFilters();
                  }}
                  className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors"
                >
                  <X className="h-3 w-3" /> Clear
                </button>
              )}
              {filtersOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>
        </CardHeader>

        {filtersOpen && (
          <CardContent className="space-y-5 pt-0">
            {/* Row 1: Order ID + Sort */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Order ID */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Order ID</label>
                <input
                  type="number"
                  min="1"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="e.g. 42"
                  className="px-3 py-2 border border-input rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Sort By */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Sort By</label>
                <FilterRadioDropdown
                  triggerLabel={
                    SORT_BY_OPTIONS.find((opt) => opt.value === sortBy)?.label || "Default"
                  }
                  panelTitle="Sort By"
                  value={sortBy}
                  options={SORT_BY_OPTIONS}
                  onChange={(value) => setSortBy(value)}
                  onReset={() => setSortBy("default")}
                />
              </div>

              {/* Sort Direction */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Sort Direction</label>
                <FilterRadioDropdown
                  triggerLabel={
                    SORT_DIRECTION_OPTIONS.find((opt) => opt.value === sortDirection)?.label ||
                    "Descending"
                  }
                  panelTitle="Sort Direction"
                  value={sortDirection}
                  options={SORT_DIRECTION_OPTIONS}
                  onChange={(value) => setSortDirection(value)}
                  onReset={() => setSortDirection("desc")}
                />
              </div>
            </div>

            {/* Row 2: Order Status */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground">Order Status</label>
              <div className="flex flex-wrap gap-2">
                {ORDER_STATUSES.map((status) => (
                  <button
                    key={status}
                    onClick={() => toggleOrderStatus(status)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${selectedOrderStatuses.includes(status)
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-background text-foreground border-input hover:border-primary/60 hover:bg-muted"
                      }`}
                  >
                    {status.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            </div>

            {/* Row 3: Payment Status */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground">Payment Status</label>
              <div className="flex flex-wrap gap-2">
                {PAYMENT_STATUSES.map((status) => (
                  <button
                    key={status}
                    onClick={() => togglePaymentStatus(status)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${selectedPaymentStatuses.includes(status)
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-background text-foreground border-input hover:border-primary/60 hover:bg-muted"
                      }`}
                  >
                    {status.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={handleClearFilters}>
                <X className="h-4 w-4 mr-1" /> Clear All
              </Button>
              <Button size="sm" onClick={handleApplyFilters}>
                <Filter className="h-4 w-4 mr-1" /> Apply Filters
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Results summary */}
      {totalElements !== undefined && (
        <p className="text-sm text-muted-foreground">
          {totalElements === 0
            ? null
            : `Showing ${orders.length} of ${totalElements} order${totalElements !== 1 ? "s" : ""}`}
        </p>
      )}

      {/* Empty state (page 0, no results) */}
      {orders.length === 0 && page === 0 && (
          <Card className="text-center py-16 border-0 shadow-none bg-transparent flex flex-col items-center justify-center">
            <CardContent>
              {hasActiveFilters ? (
                  // UI for when user HAS filtered results to nothing
                  <>
                    <ReceiptText className="h-16 w-16 text-muted-foreground/40 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-foreground mb-2">
                      No matches found
                    </h2>
                    <p className="text-muted-foreground">
                      Try adjusting your filters to find what you're looking for.
                    </p>
                  </>
              ) : (
                  // UI for a truly empty order history (The Cat Graphic)
                  <div className="space-y-6">
                    <img
                        src={theme === "dark" ? "/white_shopping_bag.png" : "/dark_shopping_bag.png"}
                        alt="No orders yet"
                        className="w-64 h-auto mx-auto drop-shadow-md animate-in fade-in zoom-in duration-300"
                    />
                    <div>
                      <h2 className="text-2xl font-bold text-foreground mb-2">
                        No orders yet!
                      </h2>
                      <p className="text-muted-foreground">
                        Looks like the bag is empty. Time to find your next meal!
                      </p>
                    </div>
                  </div>
              )}
            </CardContent>
          </Card>
      )}

      {/* Orders List */}
      <div className="space-y-6">
        {orders.map((order) => (
          <Card key={order.id} className="overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-muted/10">
              <div className="flex items-center gap-2">
                {getOrderStatusIcon(order.orderStatus)}
                <span className="font-bold text-foreground text-sm sm:text-base">
                  {order.orderStatus?.replace(/_/g, " ")}
                </span>
                <span className="text-muted-foreground text-sm hidden sm:inline">
                  | Order {order.orderStatus?.replace(/_/g, " ").toLowerCase()}
                </span>
                {canReview(order) && !order.reviewed && (
                  <Badge className="ml-2 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                    Not Reviewed
                  </Badge>
                )}
              </div>
              <Link to={`/orders/${order.id}`} className="text-primary hover:underline text-sm font-medium flex items-center transition-colors">
                View order details <span className="ml-1">›</span>
              </Link>
            </div>
            
            <CardContent className="p-6">
              {order.branchFullName && (
                <div className="flex items-center gap-3 mb-5 pb-4 border-b border-border/40">
                  {order.imageUrl ? (
                    <img 
                      src={order.imageUrl} 
                      alt={order.branchFullName} 
                      className="w-12 h-12 object-cover rounded-full border shadow-sm bg-white" 
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full border shadow-sm bg-muted flex items-center justify-center font-bold text-muted-foreground text-lg cursor-default">
                      {order.branchFullName.charAt(0)}
                    </div>
                  )}
                  <h3 className="font-bold text-xl text-foreground cursor-default">{order.branchFullName}</h3>
                </div>
              )}
              <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                
                {/* Left side: Buttons */}
                <div className="flex flex-col gap-3 w-full md:w-52 shrink-0">
                  {order.deliveryLocation && (
                    <Button
                      variant="default"
                      className="w-full justify-center bg-orange-500 hover:bg-orange-600 text-white rounded-full font-semibold shadow-sm"
                      onClick={() => handleOpenMap(order.deliveryLocation)}
                    >
                      Track
                    </Button>
                  )}
                  {order.paymentStatus === "PENDING_PAYMENT" && order.paymentMethod === "POK" && order.orderStatus !== "CANCELLED" && order.orderStatus !== "FAILED" ? (
                    <Button
                      className="w-full justify-center rounded-full font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                      onClick={() => {}}
                    >
                      Continue to Pay
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full justify-center rounded-full font-medium transition-colors hover:bg-muted"
                      onClick={() => handleOrderAgain(order)}
                    >
                      Buy this again
                    </Button>
                  )}
                  {canReview(order) && !order.reviewed && (
                    <Button
                      variant="outline"
                      className="w-full justify-center rounded-full font-medium transition-colors hover:bg-muted"
                      onClick={() => handleReviewClick(order)}
                    >
                      Review Order
                    </Button>
                  )}
                  {order.orderStatus === "CANCELLED" && order.paymentMethod === "POK" && order.paymentStatus === "COMPLETED" && (
                    <Button
                      variant="outline"
                      className="w-full justify-center rounded-full font-medium text-orange-600 border-orange-600 hover:bg-orange-100 dark:text-orange-400 dark:border-orange-400 dark:hover:bg-orange-900/30"
                      onClick={() => handleAskForRefund(order)}
                    >
                      Ask for Refund
                    </Button>
                  )}
                  {order.paymentMethod !== "CASH_ON_DELIVERY" && (
                     <Button
                       variant="outline"
                       className="w-full justify-center rounded-full font-medium transition-colors hover:bg-muted"
                       onClick={() => handlePaymentDetailsClick(order)}
                     >
                       Payment details
                     </Button>
                  )}
                  {canCancel(order) && (
                    <Button
                        variant="outline"
                        className="w-full justify-center rounded-full font-medium border-red-400 text-red-600 hover:bg-red-100 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-800 dark:hover:text-red-200"
                        onClick={() => handleCancelOrder(order)}
                        disabled={cancellingOrderId === order.id}
                    >
                      {cancellingOrderId === order.id ? "Cancelling..." : "Cancel"}
                    </Button>
                  )}
                </div>

                {/* Right side: Products Carousel */}
                <div className="flex-1 w-full overflow-hidden">
                  <div className="flex items-center gap-4 overflow-x-auto pb-4 pt-1 scrollbar-thin scrollbar-thumb-gray-200 hover:scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
                    {order.orderItems?.map((item, index) => (
                      <div 
                        key={index} 
                        className="flex-shrink-0 w-28 h-28 md:w-32 md:h-32 border rounded-xl overflow-hidden bg-white/50 relative group transition-all duration-300 hover:shadow-md hover:border-primary/30 cursor-default"
                        title={item.menu?.name}
                      >
                        <img
                          src={item.menu?.imageUrl || "/placeholder-food.jpg"}
                          alt={item.menu?.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                          x{item.quantity}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Order Footer */}
              <div className="mt-2 pt-4 border-t flex flex-wrap justify-between md:justify-end gap-x-6 gap-y-2 text-sm text-muted-foreground mr-1">
                <div>
                  {order.orderItems?.length || 0} items: <span className="text-foreground font-semibold">ALL {order.totalAmount?.toFixed(2)}</span>
                </div>
                <div>Order Time: {formatDate(order.orderDate)}</div>
                <div>Order ID: {order.id}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-4 py-4">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={isFirst}
          >
            Previous
          </Button>
          <span className="text-sm font-medium">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage((p) => p + 1)}
            disabled={isLast}
          >
            Next
          </Button>
        </div>
      )}

      <ReviewModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        order={selectedOrder}
        onSuccess={() => refetch()}
      />

      <PaymentDetailsModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        order={selectedPaymentOrder}
      />
    </div>
  );
};

export default Orders;
