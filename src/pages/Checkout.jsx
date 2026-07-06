import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { checkoutAPI, orderAPI } from "../services/api";
import { useToast } from "../contexts/ToastContext";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Plus,
  Minus,
  ArrowLeft,
  ShoppingBag,
  CreditCard,
  Truck,
  DollarSign,
  FileText,
  CheckCircle,
  MapPin, // Added MapPin for the location header
} from "lucide-react";
import CheckoutMap from "../components/CheckoutMap";
import { DeliveryLocationService } from "../services/deliveryLocationService";
import LocationSearchModal from "../components/LocationSearchModal";

const Checkout = () => {
  const { branchId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showError, showSuccess } = useToast();

  const [tipAmount, setTipAmount] = useState("");
  const [deliveryNote, setDeliveryNote] = useState("");

  // Fetch checkout preview
  const {
    data: checkoutData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["checkout", branchId],
    queryFn: () => checkoutAPI.getCheckoutPreview(branchId),
    enabled: !!branchId,
    onError: (error) => {
      const errorMessage =
        error?.response?.data?.message || "Failed to load checkout preview.";
      showError(errorMessage);
    },
  });

  const checkout = checkoutData?.data?.data;

  // Initialize tip and delivery note from checkout data
  useEffect(() => {
    if (checkout) {
      if (
        checkout.tipOptions?.selectedAmount !== undefined &&
        checkout.tipOptions?.selectedAmount !== null
      ) {
        setTipAmount(checkout.tipOptions.selectedAmount.toString());
      }
      if (
        checkout.deliveryDetailsDTO?.deliveryNote !== undefined &&
        checkout.deliveryDetailsDTO?.deliveryNote !== null
      ) {
        setDeliveryNote(checkout.deliveryDetailsDTO.deliveryNote);
      }
    }
  }, [checkout]);

  // Route Info State
  const [routeInfo, setRouteInfo] = useState({
    distance: null,
    duration: null,
  });

  // Delivery Location Logic
  const [, setDeliveryLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);

  useEffect(() => {
    const fetchDeliveryLocations = async () => {
      try {
        const response =
          await DeliveryLocationService.getAllDeliveryLocations();
        if (response.data && Array.isArray(response.data)) {
          setDeliveryLocations(response.data);
          // Find default location or use first one
          const defaultLoc = response.data.find((loc) => loc.isDefault);
          if (defaultLoc) {
            setSelectedLocation(defaultLoc);
          } else if (response.data.length > 0) {
            setSelectedLocation(response.data[0]);
          }
        }
      } catch (error) {
        console.error("Failed to fetch delivery locations", error);
      }
    };

    fetchDeliveryLocations();
  }, []);

  // Memoize location objects to prevent infinite re-renders in CheckoutMap
  const restaurantLoc = useMemo(() => {
    if (!checkout?.branch) return null;
    return {
      latitude: checkout.branch.latitude || 41.3371969076301,
      longitude: checkout.branch.longitude || 19.7748015679667,
    };
  }, [checkout?.branch]);

  const userLoc = useMemo(() => {
    if (!selectedLocation) return null;

    const latitude = Number(
      selectedLocation.latitude ??
        selectedLocation.lat ??
        selectedLocation.coordinates?.lat,
    );
    const longitude = Number(
      selectedLocation.longitude ??
        selectedLocation.lng ??
        selectedLocation.coordinates?.lng,
    );

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

    return {
      latitude,
      longitude,
      nickname: selectedLocation.nickname || "Delivery Location",
    };
  }, [selectedLocation]);

  const handleRouteCalculated = useCallback((info) => {
    setRouteInfo(info);
  }, []);

  // Mutations
  const incrementMutation = useMutation({
    mutationFn: (cartItemId) => checkoutAPI.incrementItem(cartItemId),
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      const errorMessage =
        error?.response?.data?.message || "Failed to update item quantity.";
      showError(errorMessage);
    },
  });

  const decrementMutation = useMutation({
    mutationFn: (cartItemId) => checkoutAPI.decrementItem(cartItemId),
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      const errorMessage =
        error?.response?.data?.message || "Failed to update item quantity.";
      showError(errorMessage);
    },
  });

  const updateTipMutation = useMutation({
    mutationFn: ({ cartId, amount }) => checkoutAPI.updateTip(cartId, amount),
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      const errorMessage =
        error?.response?.data?.message || "Failed to update tip.";
      showError(errorMessage);
    },
  });

  const updateDeliveryNoteMutation = useMutation({
    mutationFn: ({ cartId, note }) =>
      checkoutAPI.updateDeliveryNote(cartId, note),
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      const errorMessage =
        error?.response?.data?.message || "Failed to update delivery note.";
      showError(errorMessage);
    },
  });

  const updatePaymentMethodMutation = useMutation({
    mutationFn: ({ paymentMethodId, branchId }) =>
      checkoutAPI.updatePaymentMethod(paymentMethodId, branchId),
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      const errorMessage =
        error?.response?.data?.message || "Failed to update payment method.";
      showError(errorMessage);
    },
  });

  const isSubmittingRef = useRef(false);

  const finalCheckoutMutation = useMutation({
    mutationFn: () => orderAPI.checkout(branchId),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.removeQueries({ queryKey: ["basket", branchId] });

      // Extract the confirmUrl from the response
      const confirmUrl = response?.data?.data?._self?.confirmUrl;

      if (confirmUrl) {
        // Redirect to the payment URL
        // We don't unlock isSubmittingRef because we are navigating away
        window.location.href = confirmUrl;
      } else {
        // If no confirmUrl, show success and navigate to orders
        showSuccess("Order placed successfully!");
        navigate("/orders");
        setTimeout(() => {
          queryClient.removeQueries({ queryKey: ["checkout", branchId] });
        }, 0);
      }
    },
    onError: (error) => {
      isSubmittingRef.current = false; // unlock on error
      const errorMessage =
        error?.response?.data?.message || "Failed to place order.";
      showError(errorMessage);
    },
  });

  const handleIncrement = (cartItemId) => {
    incrementMutation.mutate(cartItemId);
  };

  const handleDecrement = (cartItemId) => {
    decrementMutation.mutate(cartItemId);
  };

  const handleTipChange = (value) => {
    setTipAmount(value);
  };

  const handleTipSuggestion = (amount) => {
    setTipAmount(amount.toString());
  };

  const handleSaveTip = () => {
    if (checkout?.id) {
      const amount = tipAmount === "" ? 0 : parseFloat(tipAmount);
      if (!isNaN(amount) && amount >= 0) {
        updateTipMutation.mutate({ cartId: checkout.id, amount });
      } else {
        showError("Please enter a valid tip amount.");
      }
    }
  };

  const handleDeliveryNoteChange = (value) => {
    setDeliveryNote(value);
  };

  const handleSaveDeliveryNote = () => {
    if (checkout?.id) {
      updateDeliveryNoteMutation.mutate({
        cartId: checkout.id,
        note: deliveryNote,
      });
    }
  };

  const handlePaymentMethodChange = (paymentMethodId) => {
    if (branchId) {
      updatePaymentMethodMutation.mutate({
        paymentMethodId,
        branchId: parseInt(branchId),
      });
    }
  };

  const handleFinalCheckout = () => {
    if (isSubmittingRef.current || finalCheckoutMutation.isPending) return;
    isSubmittingRef.current = true;
    finalCheckoutMutation.mutate();
  };

  // Location Modal Logic
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  const handleLocationClick = () => {
    setIsLocationModalOpen(true);
  };

  const handleLocationSelect = (locationData) => {
    // Update local state for map and display
    setSelectedLocation({
      latitude: locationData.coordinates.lat,
      longitude: locationData.coordinates.lng,
      nickname: locationData.nickname,
      locationName: locationData.address,
    });

    // Store in localStorage
    localStorage.setItem("userLocation", JSON.stringify(locationData));
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error || !checkout) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-red-500 mb-4">
                {error?.response?.data?.message || "Failed to load checkout."}
              </p>
              <Button onClick={() => navigate(-1)} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-background">
      {/* Map Background - Absolute Positioned */}
      {selectedLocation && checkout?.branch && (
        <div className="absolute top-0 left-0 w-full h-[450px] z-0">
          <CheckoutMap
            restaurantLocation={restaurantLoc}
            userLocation={userLoc}
            onRouteCalculated={handleRouteCalculated}
          />
          {/* Gradient overlay for better text readability and smooth transition */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-background" />
        </div>
      )}

      {/* Main Content - Z-Index 10 to float above map */}
      <div className="relative z-10 container mx-auto px-4 pt-8 max-w-4xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4 text-white hover:text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        {/* Spacer to push content down - adjusts based on map height */}
        <div className="mt-[200px] md:mt-[220px]">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              {checkout.branch?.imageUrl && (
                <img
                  src={checkout.branch.imageUrl}
                  alt={checkout.branch.name}
                  className="w-20 h-20 rounded-full object-cover border-4 border-background shadow-lg"
                />
              )}
              <div className="mb-2">
                <h1 className="text-4xl font-bold text-foreground shadow-sm white:text-gray-700">
                  Checkout
                </h1>
                {checkout.branch?.name && (
                  <p className="text-muted-foreground font-medium text-lg">
                    {checkout.branch.name}
                  </p>
                )}
              </div>
            </div>

            {/* Delivery Location Selector */}
            {selectedLocation && (
              <Card className="min-w-[250px] shadow-lg border-none bg-card/95 backdrop-blur-sm">
                <CardContent className="p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 overflow-hidden">
                    you
                    <div className="bg-primary/10 p-2 rounded-full flex-shrink-0">
                      <MapPin className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">
                        Delivery to
                      </p>
                      <p className="text-sm font-semibold truncate">
                        {selectedLocation.nickname ||
                          selectedLocation.locationName}
                      </p>
                      {(routeInfo.distance || routeInfo.duration) && (
                        <div className="flex flex-wrap gap-x-2 text-xs font-medium mt-1">
                          {routeInfo.distance && (
                            <span className="text-primary">
                              {routeInfo.distance}
                            </span>
                          )}
                          {routeInfo.duration && (
                            <span className="text-muted-foreground">
                              • {routeInfo.duration}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs"
                    onClick={handleLocationClick}
                  >
                    Change
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5" />
                  Order Items
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {checkout.orderSummary?.cartItems &&
                checkout.orderSummary.cartItems.length > 0 ? (
                  checkout.orderSummary.cartItems.map((item) => (
                    <div
                      key={item.id}
                      className={`border-b pb-4 last:border-0 ${
                        item.valid === false
                          ? "bg-destructive/10 p-3 rounded-lg"
                          : ""
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-semibold">{item.name}</p>
                          {/* <p className="text-sm text-muted-foreground">
                          ALL {Number(item.pricePerUnit).toFixed(2)} each
                        </p> */}

                          {/* Variants */}
                          {item.variants && item.variants.length > 0 && (
                            <div className="mt-2 pl-2 border-l-2 border-muted">
                              {item.variants.map((variant) => (
                                <div
                                  key={variant.id}
                                  className={`text-xs mb-1 ${
                                    variant.deleted || !variant.isAvailable
                                      ? "text-destructive line-through"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  <span>• {variant.name}</span>
                                  {variant.recommendedPrice > 0 && (
                                    <span className="ml-1">
                                      (+ALL{" "}
                                      {Number(variant.recommendedPrice).toFixed(
                                        2,
                                      )}
                                      )
                                    </span>
                                  )}
                                  {variant.deleted && (
                                    <span className="ml-1 font-semibold">
                                      (Deleted)
                                    </span>
                                  )}
                                  {!variant.isAvailable && !variant.deleted && (
                                    <span className="ml-1 font-semibold">
                                      (Unavailable)
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Validation Messages */}
                          {item.validationMessages &&
                            item.validationMessages.length > 0 && (
                              <div className="mt-2 p-2 bg-destructive/20 rounded text-xs text-destructive">
                                {item.validationMessages.map((msg, idx) => (
                                  <p key={idx}>• {msg}</p>
                                ))}
                              </div>
                            )}
                        </div>
                        <div className="w-20 text-right">
                          <p className="font-semibold">
                            ALL {Number(item.subTotal).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDecrement(item.id)}
                          disabled={
                            decrementMutation.isPending ||
                            incrementMutation.isPending ||
                            item.valid === false
                          }
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleIncrement(item.id)}
                          disabled={
                            decrementMutation.isPending ||
                            incrementMutation.isPending ||
                            item.valid === false
                          }
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    No items in cart
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Tip Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Tip
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {checkout.tipOptions?.suggestions &&
                    checkout.tipOptions.suggestions.length > 0 && (
                      <div className="space-y-2">
                        <Label>Quick Tip Options</Label>
                        <div className="flex flex-wrap gap-2">
                          {checkout.tipOptions.suggestions.map((suggestion) => (
                            <Button
                              key={suggestion}
                              variant="outline"
                              size="sm"
                              onClick={() => handleTipSuggestion(suggestion)}
                              className={
                                Number(tipAmount) === suggestion
                                  ? "border-primary bg-primary/10"
                                  : ""
                              }
                            >
                              {suggestion}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  <div className="space-y-2">
                    <Label htmlFor="tip">Custom Tip Amount</Label>
                    <Input
                      id="tip"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={tipAmount}
                      onChange={(e) => handleTipChange(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter a custom amount to add a tip
                    </p>
                  </div>
                  <Button
                    onClick={handleSaveTip}
                    disabled={updateTipMutation.isPending}
                    className="w-full"
                  >
                    {updateTipMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      "Save Tip"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Note Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Delivery Note
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="deliveryNote">Special Instructions</Label>
                    <textarea
                      id="deliveryNote"
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Add any special instructions for delivery..."
                      value={deliveryNote}
                      onChange={(e) => handleDeliveryNoteChange(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={handleSaveDeliveryNote}
                    disabled={updateDeliveryNoteMutation.isPending}
                    className="w-full"
                  >
                    {updateDeliveryNoteMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      "Save Delivery Note"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method Section */}
            {checkout.paymentOptions?.availableMethods &&
              checkout.paymentOptions.availableMethods.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Payment Method
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {checkout.paymentOptions.availableMethods.map(
                        (method) => (
                          <button
                            key={method.id}
                            onClick={() => handlePaymentMethodChange(method.id)}
                            disabled={updatePaymentMethodMutation.isPending}
                            className={`w-full text-left p-3 rounded-md border transition-colors ${
                              checkout.paymentOptions?.selectedMethod?.id ===
                              method.id
                                ? "border-primary bg-primary/10"
                                : "border-border hover:bg-muted/50"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {method.method === "CARD" ? (
                                  <CreditCard className="h-4 w-4" />
                                ) : (
                                  <Truck className="h-4 w-4" />
                                )}
                                <span className="font-medium">
                                  {method.name}
                                </span>
                              </div>
                              {checkout.paymentOptions?.selectedMethod?.id ===
                                method.id && (
                                <CheckCircle className="h-4 w-4 text-primary" />
                              )}
                            </div>
                          </button>
                        ),
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>
                      ALL{" "}
                      {Number(checkout.orderSummary?.subtotal || 0).toFixed(2)}
                    </span>
                  </div>
                  {checkout.orderSummary?.deliveryFee !== undefined && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Delivery Fee
                      </span>
                      <span>
                        ALL{" "}
                        {Number(checkout.orderSummary.deliveryFee || 0).toFixed(
                          2,
                        )}
                      </span>
                    </div>
                  )}
                  {checkout.orderSummary?.serviceFee !== undefined && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Service Fee</span>
                      <span>
                        ALL{" "}
                        {Number(checkout.orderSummary.serviceFee || 0).toFixed(
                          2,
                        )}
                      </span>
                    </div>
                  )}
                  {checkout.orderSummary?.tipAmount !== undefined &&
                    checkout.orderSummary.tipAmount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Tip</span>
                        <span>
                          ALL{" "}
                          {Number(checkout.orderSummary.tipAmount || 0).toFixed(
                            2,
                          )}
                        </span>
                      </div>
                    )}
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span>
                        ALL{" "}
                        {Number(
                          checkout.orderSummary?.totalAmount || 0,
                        ).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleFinalCheckout}
                  disabled={finalCheckoutMutation.isPending}
                >
                  {finalCheckoutMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Place Order
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Location Search Modal */}
      <LocationSearchModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onLocationSelect={handleLocationSelect}
      />
    </div>
  );
};

export default Checkout;
