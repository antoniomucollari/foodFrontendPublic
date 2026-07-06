import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { paymentAPI } from "../../services/api";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Search, RefreshCw, CreditCard, Copy, Check } from "lucide-react";

// ── helpers ────────────────────────────────────────────────────────────────

const PAYMENT_STATUS_COLORS = {
    PENDING:         "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    PENDING_PAYMENT: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    COMPLETED:       "bg-green-100  text-green-800  dark:bg-green-900/30  dark:text-green-400",
    FAILED:          "bg-red-100    text-red-800    dark:bg-red-900/30    dark:text-red-400",
    REJECTED:        "bg-red-100    text-red-800    dark:bg-red-900/30    dark:text-red-400",
    REFUNDED:        "bg-blue-100   text-blue-800   dark:bg-blue-900/30   dark:text-blue-400",
    TO_REFUND:       "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    CANCELED:        "bg-gray-100   text-gray-700   dark:bg-gray-800      dark:text-gray-400",
    EXPIRED:         "bg-gray-100   text-gray-700   dark:bg-gray-800      dark:text-gray-400",
    ABANDONED:       "bg-gray-100   text-gray-700   dark:bg-gray-800      dark:text-gray-400",
};

const REFUND_STATUS_COLORS = {
    NONE:      "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
    REQUESTED: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    APPROVED:  "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    DENIED:    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const badge = (value, map, fallback = "bg-muted text-muted-foreground") => {
    const cls = map[value] ?? fallback;
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${cls}`}>
            {value?.replace(/_/g, " ") ?? "—"}
        </span>
    );
};

const fmtDate = (val) => {
    if (!val) return "—";
    try {
        return new Intl.DateTimeFormat("en-GB", {
            dateStyle: "medium",
            timeStyle: "short",
        }).format(new Date(val));
    } catch {
        return val;
    }
};

const fmtAmount = (val) =>
    val != null
        ? `${new Intl.NumberFormat("sq-AL", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val)} L`
        : "—";

const CopyTransactionId = ({ value }) => {
    const [copied, setCopied] = React.useState(false);
    if (!value) return <span className="text-muted-foreground text-xs">—</span>;
    const handleCopy = () => {
        navigator.clipboard.writeText(value).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };
    return (
        <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-mono text-xs break-all">{value}</span>
            <button
                onClick={handleCopy}
                title={copied ? "Copied!" : "Copy transaction ID"}
                className="shrink-0 p-1 rounded hover:bg-muted transition-colors"
            >
                {copied
                    ? <Check className="h-3.5 w-3.5 text-green-500" />
                    : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
            </button>
        </div>
    );
};

const selectClass =
    "px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm h-9 shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer";

// ── component ──────────────────────────────────────────────────────────────

const BranchManagerAllPayments = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    const [filters, setFilters] = useState({
        paymentStatus:  searchParams.get("paymentStatus") || "",
        orderId:        searchParams.get("orderId")        || "",
        paymentId:      searchParams.get("paymentId")      || "",
        transactionId:  searchParams.get("transactionId")  || "",
        sortBy:         searchParams.get("sortBy")         || "",
        sortDirection:  searchParams.get("sortDirection")  || "desc",
        page:           parseInt(searchParams.get("page")) || 0,
        size:           parseInt(searchParams.get("size")) || 20,
    });

    const { data, isLoading, refetch, error } = useQuery({
        queryKey: ["branch-manager-all-payments", filters],
        queryFn: () => paymentAPI.getAllPayments(filters),
    });

    const payments    = data?.data?.data?.content    || [];
    const totalPages  = data?.data?.data?.totalPages || 0;
    const currentPage = data?.data?.data?.number     || 0;
    const totalItems  = data?.data?.data?.totalElements ?? payments.length;

    // ── filter helpers ───────────────────────────────────────────────────

    const applyFilters = (next) => {
        setFilters(next);
        const sp = new URLSearchParams();
        Object.entries(next).forEach(([k, v]) => {
            if (v !== "" && v !== 0) sp.set(k, String(v));
        });
        setSearchParams(sp);
    };

    const handleFilterChange = (key, value) =>
        applyFilters({ ...filters, [key]: value, page: 0 });

    const handlePageChange = (newPage) =>
        applyFilters({ ...filters, page: newPage });

    // ── render ───────────────────────────────────────────────────────────

    return (
        <div className="space-y-6 p-6 w-full">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
                        <CreditCard className="h-6 w-6 text-primary" />
                        All Payments
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        View all payment records for your branch
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/30 rounded-lg">
                {/* Order ID */}
                <div className="relative flex-1 min-w-[180px] max-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Order ID…"
                        value={filters.orderId}
                        onChange={(e) => handleFilterChange("orderId", e.target.value)}
                        className="pl-10 h-9"
                        type="number"
                        min="1"
                    />
                </div>

                {/* Payment ID */}
                <div className="relative flex-1 min-w-[180px] max-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Payment ID…"
                        value={filters.paymentId}
                        onChange={(e) => handleFilterChange("paymentId", e.target.value)}
                        className="pl-10 h-9"
                        type="number"
                        min="1"
                    />
                </div>

                {/* Transaction ID */}
                <div className="relative flex-1 min-w-[200px] max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Transaction ID…"
                        value={filters.transactionId}
                        onChange={(e) => handleFilterChange("transactionId", e.target.value)}
                        className="pl-10 h-9"
                    />
                </div>

                {/* Payment Status */}
                <select
                    value={filters.paymentStatus}
                    onChange={(e) => handleFilterChange("paymentStatus", e.target.value)}
                    className={selectClass}
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
                    className={selectClass}
                >
                    <option value="">Sort by: Default</option>
                    <option value="amount">Amount</option>
                    <option value="paymentDate">Payment Date</option>
                    <option value="createdDate">Created Date</option>
                </select>

                {/* Sort Direction */}
                <select
                    value={filters.sortDirection}
                    onChange={(e) => handleFilterChange("sortDirection", e.target.value)}
                    className={selectClass}
                >
                    <option value="desc">Descending</option>
                    <option value="asc">Ascending</option>
                </select>

                {/* Page Size */}
                <select
                    value={filters.size}
                    onChange={(e) => handleFilterChange("size", parseInt(e.target.value))}
                    className={selectClass}
                >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                </select>
            </div>

            {/* Table */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium">Payments</h2>
                    <span className="text-sm text-muted-foreground">{totalItems} found</span>
                </div>

                {isLoading && (
                    <div className="flex items-center justify-center py-12">
                        <RefreshCw className="h-6 w-6 animate-spin mr-2 text-primary" />
                        <span className="text-muted-foreground">Loading payments…</span>
                    </div>
                )}

                {error && (
                    <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-4">
                        <p className="font-medium">Error loading payments</p>
                        <p className="text-sm">{error.message}</p>
                    </div>
                )}

                {!isLoading && !error && payments.length === 0 && (
                    <div className="text-center py-16">
                        <CreditCard className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-muted-foreground">No payments found</p>
                    </div>
                )}

                {!isLoading && payments.length > 0 && (
                    <div className="overflow-x-auto rounded-lg border border-border">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-muted/50 border-b border-border">
                                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">ID</th>
                                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Order ID</th>
                                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Amount (ALL)</th>
                                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Gateway</th>
                                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Transaction ID</th>
                                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Payment Date</th>
                                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Created</th>
                                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Expires At</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {payments.map((p) => (
                                    <tr
                                        key={p.id}
                                        className="hover:bg-muted/30 transition-colors duration-150"
                                    >
                                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">#{p.id}</td>
                                        <td className="px-4 py-3 font-mono text-xs">
                                            {p.orderId ? (
                                                <span className="font-medium text-foreground">#{p.orderId}</span>
                                            ) : "—"}
                                        </td>
                                        <td className="px-4 py-3 font-semibold">{fmtAmount(p.amount)}</td>
                                        <td className="px-4 py-3">{badge(p.paymentStatus, PAYMENT_STATUS_COLORS)}</td>
                                        <td className="px-4 py-3 text-xs text-muted-foreground">{p.paymentGateway ?? "—"}</td>
                                        <td className="px-4 py-3">
                                            {p.transactionId
                                                ? <CopyTransactionId value={p.transactionId} />
                                                : <span className="text-muted-foreground text-xs">—</span>}
                                        </td>
                                        <td className="px-4 py-3 text-xs whitespace-nowrap">{fmtDate(p.paymentDate)}</td>
                                        <td className="px-4 py-3 text-xs whitespace-nowrap">{fmtDate(p.createdDate)}</td>
                                        <td className="px-4 py-3 text-xs whitespace-nowrap">{fmtDate(p.expiresAt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
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
    );
};

export default BranchManagerAllPayments;
