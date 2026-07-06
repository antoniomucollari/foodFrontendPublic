import React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { orderAPI } from "../services/api";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { ArrowLeft, MapPin, Map, ReceiptText, CreditCard, Clock, Truck, Star, Info, FileText } from "lucide-react";

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    data: responseData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["order-details", id],
    queryFn: () => orderAPI.getOrderDetails(id),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !responseData?.data?.data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-red-500 text-lg">Error loading order details</p>
        <Button variant="outline" onClick={() => navigate("/orders")}>
          Back to Orders
        </Button>
      </div>
    );
  }

  const details = responseData.data.data;
  const order = details.orderDTO;
  const payments = details.paymentDTO || [];

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const statusColors = {
    INITIALIZED: "bg-yellow-100 text-yellow-800",
    CONFIRMED: "bg-blue-100 text-blue-800",
    ON_THE_WAY: "bg-purple-100 text-purple-800",
    DELIVERED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
    FAILED: "bg-red-100 text-red-800",
  };

  const getStatusColor = (status) => statusColors[status] || "bg-gray-100 text-gray-800";

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-full">
          <Link to="/orders">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-foreground">Order #{order.id}</h1>
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(order.orderStatus)}`}>
          {order.orderStatus?.replace(/_/g, " ")}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content (Left) */}
        <div className="md:col-span-2 space-y-6">
          {/* Restaurant Info */}
          <Card className="overflow-hidden border-border/60">
            <CardContent className="p-0">
              <div className="bg-muted/10 px-6 py-4 flex items-center justify-between border-b">
                <div className="flex items-center gap-3">
                  {order.imageUrl && (
                    <img
                        src={order.imageUrl}
                        alt={order.branchFullName}
                        className="w-12 h-12 object-cover rounded-full border bg-white"
                    />
                  )}
                  <div>
                    <h2 className="font-bold text-lg">{order.branchFullName}</h2>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <ReceiptText className="h-4 w-4" /> Date: {formatDate(order.orderDate)}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Items */}
              <div className="p-6 space-y-4">
                <h3 className="font-bold text-lg border-b pb-2">Items</h3>
                <div className="space-y-4">
                  {order.orderItems?.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="relative w-16 h-16 shrink-0">
                        <img
                            src={item.menu?.imageUrl || "/placeholder-food.jpg"}
                            alt={item.menu?.name}
                            className="w-full h-full object-cover rounded-lg border shadow-sm"
                        />
                        <div className="absolute -top-2 -right-2 bg-black text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                          {item.quantity}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className="font-semibold text-foreground">{item.menu?.name}</h4>
                          <span className="font-semibold text-foreground">
                            ALL {(item.pricePerUnit * item.quantity).toFixed(2)}
                          </span>
                        </div>
                        {item.variants?.length > 0 && (
                          <div className="mt-1 space-y-1">
                            {item.variants.map((v) => (
                              <p key={v.id} className="text-xs text-muted-foreground flex justify-between">
                                <span>+ {v.variantName}</span>
                                {v.priceCharged > 0 && <span>ALL {v.priceCharged.toFixed(2)}</span>}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Times & Delivery Info */}
          <Card className="border-border/60">
            <CardContent className="p-6 space-y-6">
              <h3 className="font-bold text-lg border-b pb-2 flex items-center gap-2">
                 Delivery Details
              </h3>
              
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div>
                    <h4 className="font-medium text-sm text-foreground">Delivery Address</h4>
                    <p className="text-sm text-muted-foreground">{order.address}</p>
                  </div>
                </div>

                {order.deliveryPerson && (
                  <div className="bg-muted/20 p-4 rounded-xl border border-muted flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                      {order.deliveryPerson.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">Courier: {order.deliveryPerson.name}</h4>
                      <p className="text-xs text-muted-foreground">+355 {order.deliveryPerson.phoneNumber}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="flex gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 shrink-0" />
                    <div>
                      <p className="font-medium text-foreground text-xs">Est. Delivery</p>
                      <p className="text-xs">{formatDate(details.estDeliveryDate)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 shrink-0" />
                    <div>
                      <p className="font-medium text-foreground text-xs">Delivered At</p>
                      <p className="text-xs">{formatDate(details.deliveryDate)}</p>
                    </div>
                  </div>
                  {details.pickedUpAt && (
                      <div className="flex gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 shrink-0" />
                        <div>
                          <p className="font-medium text-foreground text-xs">Picked Up At</p>
                          <p className="text-xs">{formatDate(details.pickedUpAt)}</p>
                        </div>
                      </div>
                  )}
                </div>

                {details.reasonOfFailure && (
                    <div className="bg-red-50 p-3 rounded-lg border border-red-100 flex items-start gap-2 mt-2">
                      <Info className="h-4 w-4 text-red-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-red-800">Failure Reason</p>
                        <p className="text-sm text-red-700">{details.reasonOfFailure}</p>
                      </div>
                    </div>
                )}

              </div>
            </CardContent>
          </Card>

          {/* Review Info (If any) */}
          {details.reviewStars && (
              <Card className="border-border/60">
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg border-b pb-2 mb-4 flex items-center gap-2">
                    <Star className="h-5 w-5 text-orange-500 fill-orange-500" /> Your Review
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className={`h-4 w-4 ${star <= details.reviewStars ? "text-orange-500 fill-orange-500" : "text-gray-300"}`} />
                      ))}
                    </div>
                    {details.reviewMessage && (
                        <p className="text-sm text-foreground italic">"{details.reviewMessage}"</p>
                    )}
                  </div>
                </CardContent>
              </Card>
          )}

        </div>

        {/* Sidebar (Right) */}
        <div className="space-y-6">
          {/* Order Summary */}
          <Card className="border-border/60">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-bold text-lg border-b pb-2 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" /> Summary
              </h3>
              
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>ALL {(order.totalAmount - (details.serviceFee || 0)).toFixed(2)}</span>
                </div>
                {details.serviceFee != null && (
                    <div className="flex justify-between">
                      <span>Service Fee</span>
                      <span>ALL {details.serviceFee.toFixed(2)}</span>
                    </div>
                )}
                {/* Additional logic can be added if delivery fees are in the object. Currently, totalAmount includes it. */}
                <div className="flex justify-between font-bold text-base text-foreground pt-3 border-t">
                  <span>Total</span>
                  <span>ALL {order.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Details */}
          <Card className="border-border/60">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-bold text-lg border-b pb-2 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" /> Payment
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Method</span>
                  <span className="text-sm font-semibold">{order.paymentMethod?.replace(/_/g, " ")}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      order.paymentStatus === "COMPLETED" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                  }`}>
                    {order.paymentStatus?.replace(/_/g, " ")}
                  </span>
                </div>

                {payments.length > 0 && payments[0].transactionId && (
                    <div className="bg-muted/20 p-3 rounded-lg border border-border mt-2">
                      <p className="text-[10px] text-muted-foreground uppercase font-semibold mb-1">Transaction ID</p>
                      <p className="text-xs break-all font-mono">{payments[0].transactionId}</p>
                    </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
