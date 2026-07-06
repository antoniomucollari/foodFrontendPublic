import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  User,
  Calendar,
  DollarSign,
  Package,
  MapPin,
  Truck,
  ChevronDown,
  ChevronUp,
  Phone,
  Mail,
  Hash,
  CreditCard,
  StickyNote,
} from "lucide-react";

const OrderDetailModal = ({ order, isOpen, onClose }) => {
  const [isCustomerInfoExpanded, setIsCustomerInfoExpanded] = useState(false);

  if (!order) return null;

  const getOrderStatusColor = (status) => {
    switch (status) {
      case "INITIALIZED":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "CONFIRMED":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "PREPARING":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "READY_FOR_PICKUP":
        return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200";
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
      case "REFUNDED":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "CANCELED":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "TO_REFUND":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const calculateItemTotal = (item) => {
    const price =
      item.menu?.price || item.menuItem?.price || item.pricePerUnit || 0;
    return item.quantity * price;
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Order Details - #{order.id}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Package className="h-4 w-4 mr-2" />
                  Order Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge className={getOrderStatusColor(order.orderStatus)}>
                  {order.orderStatus?.replace("_", " ") || "Unknown"}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Payment Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge className={getPaymentStatusColor(order.paymentStatus)}>
                  {order.paymentStatus?.replace("_", " ") || "Unknown"}
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() =>
                  setIsCustomerInfoExpanded(!isCustomerInfoExpanded)
                }
              >
                <CardTitle className="text-sm font-medium flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Customer Information
                </CardTitle>
                <div className="flex items-center">
                  <span className="text-sm text-muted-foreground mr-2">
                    {order.user?.name ||
                      (order.user?.firstName && order.user?.lastName
                        ? `${order.user.firstName} ${order.user.lastName}`
                        : order.user?.firstName ||
                        order.user?.lastName ||
                        "N/A")}
                  </span>
                  {isCustomerInfoExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>
            </CardHeader>
            {isCustomerInfoExpanded && (
              <CardContent>
                <div className="space-y-4">
                  {/* Name and Email Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start space-x-3">
                      <User className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-muted-foreground">Name</p>
                        <p className="font-medium">
                          {order.user?.name ||
                            (order.user?.firstName && order.user?.lastName
                              ? `${order.user.firstName} ${order.user.lastName}`
                              : order.user?.firstName ||
                              order.user?.lastName ||
                              "N/A")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Mail className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">
                          {order.user?.email || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Phone Number Row */}
                  <div className="flex items-start space-x-3">
                    <Phone className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">
                        Phone Number
                      </p>
                      <p className="font-medium">
                        {order.user?.phoneNumber ||
                          order.user?.phone ||
                          order.phoneNumber ||
                          order.phone ||
                          "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* Address Row */}
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Address</p>
                      <p className="font-medium">
                        {order.user?.address ||
                          order.address ||
                          order.deliveryAddress ||
                          (order.user?.street &&
                            order.user?.city &&
                            order.user?.state &&
                            order.user?.zipCode
                            ? `${order.user.street}, ${order.user.city}, ${order.user.state} ${order.user.zipCode}`
                            : order.user?.street ||
                              order.user?.city ||
                              order.user?.state ||
                              order.user?.zipCode
                              ? `${order.user.street || ""}, ${order.user.city || ""
                                }, ${order.user.state || ""} ${order.user.zipCode || ""
                                }`
                                .replace(/^,\s*|,\s*$/g, "")
                                .replace(/,\s*,/g, ",")
                              : "N/A")}
                      </p>
                    </div>
                  </div>

                  {/* User ID Row */}
                  <div className="flex items-start space-x-3">
                    <Hash className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground">User ID</p>
                      <p className="font-medium">{order.user?.id || "N/A"}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Delivery Person Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center">
                <Truck className="h-4 w-4 mr-2" />
                Delivery Person
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">
                    {order.deliveryPerson?.name ||
                      (order.deliveryPerson?.firstName &&
                        order.deliveryPerson?.lastName
                        ? `${order.deliveryPerson.firstName} ${order.deliveryPerson.lastName}`
                        : order.deliveryPerson?.firstName ||
                        order.deliveryPerson?.lastName ||
                        "Not Assigned")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">
                    {order.deliveryPerson?.email || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Delivery Person ID
                  </p>
                  <p className="font-medium">
                    {order.deliveryPerson?.id || "N/A"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Order Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Order Date</p>
                  <p className="font-medium">{formatDate(order.orderDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="font-medium text-lg">
                    ALL {order.totalAmount?.toFixed(2) || "0.00"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Method</p>
                  <div className="flex items-center mt-1">
                    <CreditCard className="h-4 w-4 mr-2 text-muted-foreground" />
                    <p className="font-medium">
                      {order.paymentMethod
                        ? order.paymentMethod
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (c) => c.toUpperCase())
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Location */}
          {order.deliveryLocation && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    Delivery Location
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenMap(order.deliveryLocation)}
                    className="flex items-center space-x-1"
                    title="Open in Maps"
                  >
                    <MapPin className="h-4 w-4 text-green-600" />
                    <span>Open Map</span>
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="font-medium">
                      {order.deliveryLocation.locationName || "N/A"}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Latitude</p>
                      <p className="font-medium font-mono text-sm">
                        {order.deliveryLocation.latitude?.toFixed(6) || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Longitude</p>
                      <p className="font-medium font-mono text-sm">
                        {order.deliveryLocation.longitude?.toFixed(6) || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.orderItems?.map((item, index) => (
                  <div
                    key={index}
                    className="flex  items-start space-x-4 p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    {/* Menu Item Image */}
                    <div className="flex-shrink-0">
                      <img
                        src={
                          item.menu?.imageUrl ||
                          item.menuItem?.imageUrl ||
                          "/placeholder-food.jpg"
                        }
                        alt={
                          item.menu?.name ||
                          item.menuItem?.name ||
                          `Item ${index + 1}`
                        }
                        className="w-20 h-20 object-cover rounded-lg border border-border"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "/placeholder-food.jpg";
                        }}
                      />
                    </div>

                    {/* Menu Item Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-lg mb-1">
                        {item.menu?.name ||
                          item.menuItem?.name ||
                          `Item ${index + 1}`}
                      </h4>
                      {item.menu?.description || item.menuItem?.description ? (
                        <p
                          className="text-sm text-muted-foreground mb-2 overflow-hidden"
                          style={{
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                          }}
                        >
                          {item.menu?.description || item.menuItem?.description}
                        </p>
                      ) : null}

                      {(item.variants || []).length > 0 && (
                        <div className="text-sm text-muted-foreground mb-2">
                          {item.variants.map((variant) => (
                            <div key={variant.id} className="flex gap-1">
                              <span>+ {variant.variantName}</span>
                              {variant.priceCharged > 0 && (
                                <span>
                                  (ALL {variant.priceCharged.toFixed(2)})
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span className="flex items-center">
                          <span className="font-medium">Qty:</span>
                          <span className="ml-1 font-semibold text-foreground">
                            {item.quantity}
                          </span>
                        </span>
                        <span className="flex items-center">
                          <span className="font-medium">Price:</span>
                          <span className="ml-1 font-semibold text-foreground">
                            ALL {(
                              item.menu?.price ||
                              item.menuItem?.price ||
                              item.pricePerUnit ||
                              0
                            ).toFixed(2)}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Total Price */}
                    <div className="flex-shrink-0 text-right">
                      <p className="text-lg font-bold text-primary">
                        ALL {calculateItemTotal(item).toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                  </div>
                ))}

                {/* Order Summary */}
                {order.orderItems && order.orderItems.length > 0 && (
                  <div className="border-t border-border pt-4 mt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">
                        Order Total:
                      </span>
                      <span className="text-xl font-bold text-primary">
                        ALL {order.totalAmount?.toFixed(2) || "0.00"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-muted-foreground mt-1">
                      <span>
                        {order.orderItems.length} item
                        {order.orderItems.length !== 1 ? "s" : ""}
                      </span>
                      <span>
                        {order.orderItems.reduce(
                          (total, item) => total + item.quantity,
                          0
                        )}{" "}
                        total quantity
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Delivery Information */}
          {order.deliveryAddress && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  Delivery Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-medium">
                    {order.deliveryAddress.street || "N/A"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {order.deliveryAddress.city}, {order.deliveryAddress.state}{" "}
                    {order.deliveryAddress.zipCode}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {order.deliveryAddress.country}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Order Notes */}
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Order Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{order.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Delivery Note */}
          {order.deliveryNote && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center">
                  <StickyNote className="h-4 w-4 mr-2" />
                  Delivery Note
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm bg-muted/50 rounded-md p-3 border border-border">
                  {order.deliveryNote}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailModal;
