import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { cartAPI } from "../services/api";
import { Button } from "./ui/button";
import { Minus, Plus, Trash2, AlertTriangle } from "lucide-react";

const Basket = ({ branchId }) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const {
    data: basketRes,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["basket", branchId],
    queryFn: () => cartAPI.getShoppingCart(branchId),
    enabled: !!branchId,
  });

  // Mutations for increment, decrement, remove, clear
  const incrementMutation = useMutation({
    mutationFn: (cartItemId) => cartAPI.incrementItem(cartItemId),
    onSuccess: () => queryClient.invalidateQueries(["basket", branchId]),
  });
  const decrementMutation = useMutation({
    mutationFn: (cartItemId) => cartAPI.decrementItem(cartItemId),
    onSuccess: () => queryClient.invalidateQueries(["basket", branchId]),
  });
  const removeItemMutation = useMutation({
    mutationFn: (cartItemId) => cartAPI.removeItem(cartItemId),
    onSuccess: () => queryClient.invalidateQueries(["basket", branchId]),
  });
  const clearCartMutation = useMutation({
    mutationFn: () => cartAPI.clearCart(branchId),
    onSuccess: () => queryClient.invalidateQueries(["basket", branchId]),
  });

  const basket = basketRes?.data?.data;

  if (isLoading) {
    return (
      <div className="p-4 border rounded-lg">
        <h2 className="text-lg font-bold mb-4">Basket</h2>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error || !basket || !basket.items || basket.items.length === 0) {
    return (
      <div className="p-4 border rounded-lg">
        <h2 className="text-lg font-bold mb-4">Basket</h2>
        <p className="text-muted-foreground">Your basket is empty.</p>
      </div>
    );
  }

  // Check if there are any invalid items
  const hasInvalidItems = basket.items.some(item => !item.valid);

  return (
    <div className="p-4 border rounded-lg space-y-4">
      <h2 className="text-lg font-bold">Basket</h2>

      {/* Restaurant Branch Name */}
      {basket.restaurantBranchName && (
        <p className="text-sm text-muted-foreground">
          {basket.restaurantBranchName}
        </p>
      )}

      <div className="space-y-3">
        {basket.items.map((item) => (
          <div
            key={item.id}
            className={`p-3 rounded-lg border ${!item.valid
              ? 'bg-destructive/10 border-destructive/50'
              : 'bg-card'
              }`}
          >
            {/* Item Header */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{item.name}</p>
                  {!item.valid && (
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  )}
                </div>
                {/* <p className="text-sm text-muted-foreground">
                  ALL {Number(item.pricePerUnit).toFixed(2)} each
                </p> */}
              </div>
              <p className="font-semibold">
                ALL {Number(item.subTotal).toFixed(2)}
              </p>
            </div>

            {/* Variants */}
            {item.variants && item.variants.length > 0 && (
              <div className="mb-2 pl-2 border-l-2 border-muted">
                {item.variants.map((variant) => (
                  <div
                    key={variant.id}
                    className={`text-xs mb-1 ${variant.deleted || !variant.isAvailable
                      ? 'text-destructive line-through'
                      : 'text-muted-foreground'
                      }`}
                  >
                    <span>• {variant.name}</span>
                    {variant.recommendedPrice > 0 && (
                      <span className="ml-1">
                        (+ALL {Number(variant.recommendedPrice).toFixed(2)})
                      </span>
                    )}
                    {variant.deleted && (
                      <span className="ml-1 font-semibold">(Deleted)</span>
                    )}
                    {!variant.isAvailable && !variant.deleted && (
                      <span className="ml-1 font-semibold">(Unavailable)</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Validation Messages */}
            {item.validationMessages && item.validationMessages.length > 0 && (
              <div className="mb-2 p-2 bg-destructive/20 rounded text-xs text-destructive">
                {item.validationMessages.map((msg, idx) => (
                  <p key={idx}>• {msg}</p>
                ))}
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-6 w-6"
                onClick={() => decrementMutation.mutate(item.id)}
                disabled={decrementMutation.isPending || !item.valid}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="min-w-[20px] text-center">{item.quantity}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-6 w-6"
                onClick={() => incrementMutation.mutate(item.id)}
                disabled={incrementMutation.isPending || !item.valid}
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => removeItemMutation.mutate(item.id)}
                disabled={removeItemMutation.isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Warning for invalid items */}
      {hasInvalidItems && (
        <div className="p-3 bg-destructive/10 border border-destructive/50 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-destructive">
                Some items are unavailable
              </p>
              <p className="text-xs text-destructive/80 mt-1">
                Please remove invalid items before proceeding to checkout.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="border-t pt-4 space-y-2">
        <div className="flex justify-between">
          <p className="font-semibold">Subtotal</p>
          <p className="font-semibold">ALL {Number(basket.subtotal).toFixed(2)}</p>
        </div>
        <Button
          variant="destructive"
          size="icon"
          className="mb-2 float-right"
          onClick={() => clearCartMutation.mutate()}
          disabled={clearCartMutation.isPending}
          title="Clear Basket"
        >
          <Trash2 className="h-5 w-5" />
        </Button>
        <Button
          className="w-full"
          onClick={() => navigate(`/checkout/${branchId}`)}
          disabled={hasInvalidItems}
        >
          Checkout
        </Button>
      </div>
    </div>
  );
};

export default Basket;
