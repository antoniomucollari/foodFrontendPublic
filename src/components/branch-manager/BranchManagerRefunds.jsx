import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { paymentAPI } from "../../services/api";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
    Search,
    RefreshCw,
    RotateCcw,
    Copy,
    Check,
    AlertCircle,
    X,
} from "lucide-react";

// ── helpers ────────────────────────────────────────────────────────────────

const fmtAmount = (val) =>
    val != null
        ? `${new Intl.NumberFormat("sq-AL", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
          }).format(val)} L`
        : "—";

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

const selectClass =
    "px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm h-9 shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer";

// ── CopyTransactionId ──────────────────────────────────────────────────────

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
                {copied ? (
                    <Check className="h-3.5 w-3.5 text-green-500" />
                ) : (
                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                )}
            </button>
        </div>
    );
};

// ── RefundConfirmModal ─────────────────────────────────────────────────────

const RefundConfirmModal = ({ payment, onConfirm, onClose, isPending }) => {
    const [reason, setReason] = useState("");

    if (!payment) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative z-10 bg-card border border-border rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                            <RotateCcw className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-foreground">
                                Confirm Refund
                            </h2>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Payment #{payment.id} — Order #{payment.orderId}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                        disabled={isPending}
                    >
                        <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                </div>

                {/* Payment summary */}
                <div className="bg-muted/40 rounded-lg p-4 mb-5 space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Amount</span>
                        <span className="font-semibold">{fmtAmount(payment.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Gateway</span>
                        <span>{payment.paymentGateway ?? "—"}</span>
                    </div>
                    {payment.transactionId && (
                        <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground shrink-0">
                                Transaction ID
                            </span>
                            <span className="font-mono text-xs text-right break-all">
                                {payment.transactionId}
                            </span>
                        </div>
                    )}
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Payment Date</span>
                        <span>{fmtDate(payment.paymentDate)}</span>
                    </div>
                </div>

                {/* Reason */}
                <div className="mb-5">
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                        Refund Reason <span className="text-destructive">*</span>
                    </label>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Enter the reason for refunding this payment…"
                        rows={3}
                        className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        disabled={isPending}
                    />
                </div>

                {/* Warning */}
                <div className="flex items-start gap-2 p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 mb-5">
                    <AlertCircle className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-orange-700 dark:text-orange-400">
                        This action will process the refund via the payment gateway. It
                        cannot be undone.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        className="flex-1"
                        onClick={onClose}
                        disabled={isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                        onClick={() => onConfirm(payment.id, reason)}
                        disabled={!reason.trim() || isPending}
                    >
                        {isPending ? (
                            <>
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                Processing…
                            </>
                        ) : (
                            <>
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Refund
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
};

// ── main component ─────────────────────────────────────────────────────────

const BranchManagerRefunds = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const queryClient = useQueryClient();

    const [filters, setFilters] = useState({
        orderId:       searchParams.get("orderId")       || "",
        paymentId:     searchParams.get("paymentId")     || "",
        transactionId: searchParams.get("transactionId") || "",
        sortBy:        searchParams.get("sortBy")        || "",
        sortDirection: searchParams.get("sortDirection") || "desc",
        page:          parseInt(searchParams.get("page")) || 0,
        size:          parseInt(searchParams.get("size")) || 20,
    });

    const [selectedPayment, setSelectedPayment] = useState(null);

    // Always fetches with paymentStatus=TO_REFUND fixed
    const { data, isLoading, refetch, error } = useQuery({
        queryKey: ["branch-manager-refunds", filters],
        queryFn: () =>
            paymentAPI.getAllPayments({ ...filters, paymentStatus: "TO_REFUND" }),
    });

    const payments    = data?.data?.data?.content    || [];
    const totalPages  = data?.data?.data?.totalPages || 0;
    const currentPage = data?.data?.data?.number     || 0;
    const totalItems  = data?.data?.data?.totalElements ?? payments.length;

    const { mutate: doRefund, isPending: isRefunding } = useMutation({
        mutationFn: ({ paymentId, reason }) =>
            paymentAPI.refundPayment(paymentId, reason),
        onSuccess: () => {
            setSelectedPayment(null);
            queryClient.invalidateQueries({ queryKey: ["branch-manager-refunds"] });
            queryClient.invalidateQueries({ queryKey: ["branch-manager-all-payments"] });
        },
        onError: () => {
            // Toast shown by global interceptor
        },
    });

    // ── filter helpers ─────────────────────────────────────────────────────

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

    // ── render ─────────────────────────────────────────────────────────────

    return (
        <>
            <div className="space-y-6 p-6 w-full">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
                            <RotateCcw className="h-6 w-6 text-orange-500" />
                            Refund Requests
                        </h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Payments awaiting refund — status{" "}
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                                TO REFUND
                            </span>
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
                            onChange={(e) =>
                                handleFilterChange("transactionId", e.target.value)
                            }
                            className="pl-10 h-9"
                        />
                    </div>

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
                        onChange={(e) =>
                            handleFilterChange("sortDirection", e.target.value)
                        }
                        className={selectClass}
                    >
                        <option value="desc">Descending</option>
                        <option value="asc">Ascending</option>
                    </select>

                    {/* Page Size */}
                    <select
                        value={filters.size}
                        onChange={(e) =>
                            handleFilterChange("size", parseInt(e.target.value))
                        }
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
                        <h2 className="text-lg font-medium">Pending Refunds</h2>
                        <span className="text-sm text-muted-foreground">
                            {totalItems} found
                        </span>
                    </div>

                    {isLoading && (
                        <div className="flex items-center justify-center py-12">
                            <RefreshCw className="h-6 w-6 animate-spin mr-2 text-orange-500" />
                            <span className="text-muted-foreground">
                                Loading refund requests…
                            </span>
                        </div>
                    )}

                    {error && (
                        <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-4">
                            <p className="font-medium">Error loading refund requests</p>
                            <p className="text-sm">{error.message}</p>
                        </div>
                    )}

                    {!isLoading && !error && payments.length === 0 && (
                        <div className="text-center py-16">
                            <RotateCcw className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                            <p className="text-muted-foreground font-medium">
                                No refund requests
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                                All caught up — no payments are awaiting refund.
                            </p>
                        </div>
                    )}

                    {!isLoading && payments.length > 0 && (
                        <div className="overflow-x-auto rounded-lg border border-border">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-muted/50 border-b border-border">
                                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                                            ID
                                        </th>
                                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                                            Order ID
                                        </th>
                                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                                            Amount (ALL)
                                        </th>
                                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                                            Gateway
                                        </th>
                                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                                            Transaction ID
                                        </th>
                                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                                            Payment Date
                                        </th>
                                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                                            Created
                                        </th>
                                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {payments.map((p) => (
                                        <tr
                                            key={p.id}
                                            className="hover:bg-muted/30 transition-colors duration-150"
                                        >
                                            <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                                                #{p.id}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs">
                                                {p.orderId ? (
                                                    <span className="font-medium text-foreground">
                                                        #{p.orderId}
                                                    </span>
                                                ) : (
                                                    "—"
                                                )}
                                            </td>
                                            <td className="px-4 py-3 font-semibold">
                                                {fmtAmount(p.amount)}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-muted-foreground">
                                                {p.paymentGateway ?? "—"}
                                            </td>
                                            <td className="px-4 py-3 max-w-[260px]">
                                                <CopyTransactionId value={p.transactionId} />
                                            </td>
                                            <td className="px-4 py-3 text-xs whitespace-nowrap">
                                                {fmtDate(p.paymentDate)}
                                            </td>
                                            <td className="px-4 py-3 text-xs whitespace-nowrap">
                                                {fmtDate(p.createdDate)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Button
                                                    size="sm"
                                                    className="h-7 px-3 text-xs bg-orange-600 hover:bg-orange-700 text-white"
                                                    onClick={() => setSelectedPayment(p)}
                                                >
                                                    <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                                                    Refund
                                                </Button>
                                            </td>
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

            {/* Refund confirm modal */}
            <RefundConfirmModal
                payment={selectedPayment}
                onClose={() => setSelectedPayment(null)}
                isPending={isRefunding}
                onConfirm={(paymentId, reason) => doRefund({ paymentId, reason })}
            />
        </>
    );
};

export default BranchManagerRefunds;
