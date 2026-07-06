import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { paymentAPI } from "../services/api";
import { toast } from "react-toastify";
import { Badge } from "./ui/badge";
import { Loader2 } from "lucide-react";

const PaymentDetailsModal = ({ isOpen, onClose, order }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && order) {
      fetchPaymentDetails();
    } else {
      setPayments([]);
    }
  }, [isOpen, order]);

  const fetchPaymentDetails = async () => {
    setLoading(true);
    try {
      const res = await paymentAPI.getOrderPayments(order.id);
      let data = res.data?.data?.content || res.data?.content || res.data?.data || res.data || [];
      if (!Array.isArray(data)) {
        data = data ? [data] : [];
      }
      setPayments(data);
    } catch (error) {
      console.error("Failed to fetch payment details:", error);
      toast.error("Failed to load payment details");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Payment Details</DialogTitle>
          <DialogDescription>
            Order #{order.id}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : payments && payments.length > 0 ? (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1">
              {payments.map((payment, index) => (
                <div key={payment.id || index} className="space-y-3 border rounded-lg p-4 bg-card">
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="font-semibold text-primary">Payment #{payments.length - index}</span>
                    <Badge variant={payment.paymentStatus === "COMPLETED" ? "default" : "secondary"}>
                      {payment.paymentStatus?.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-sm font-medium text-muted-foreground">Amount</span>
                    <span className="font-semibold">ALL {payment.amount?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-sm font-medium text-muted-foreground">Method</span>
                    <span className="font-medium">{payment.paymentGateway?.replace(/_/g, " ") || "N/A"}</span>
                  </div>
                  <div className="flex justify-between items-start py-1 gap-4">
                    <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Transaction ID</span>
                    <span className="text-sm font-mono text-right break-all">
                      {payment.transactionId || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-sm font-medium text-muted-foreground">Date</span>
                    <span className="text-sm">
                      {(payment.paymentDate || payment.createdDate)
                        ? new Date(payment.paymentDate || payment.createdDate).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "N/A"}
                    </span>
                  </div>
                  {payment.paymentUrl && (payment.paymentStatus === "PENDING_PAYMENT" || payment.paymentStatus === "AWAITING") && (
                    <div className="pt-2 flex justify-end">
                      <a href={payment.paymentUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline">
                        Complete Payment
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
             <div className="text-center py-8 text-muted-foreground">
               No payment details found for this order.
             </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentDetailsModal;
