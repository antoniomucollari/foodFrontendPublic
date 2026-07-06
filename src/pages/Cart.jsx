import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { cartAPI, orderAPI } from '../services/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard,
  ArrowLeft,
  CheckCircle
} from 'lucide-react';
import { useState } from 'react';

const Cart = () => {
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const queryClient = useQueryClient();

  // Fetch cart data
  const { data: cartData, isLoading, error } = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartAPI.getShoppingCart(),
  });

  // Mutations
  const incrementMutation = useMutation({
    mutationFn: (menuId) => cartAPI.incrementItem(menuId),
    onSuccess: () => {
      queryClient.invalidateQueries(['cart']);
    },
  });

  const decrementMutation = useMutation({
    mutationFn: (menuId) => cartAPI.decrementItem(menuId),
    onSuccess: () => {
      queryClient.invalidateQueries(['cart']);
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: (cartItemId) => cartAPI.removeItem(cartItemId),
    onSuccess: () => {
      queryClient.invalidateQueries(['cart']);
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: () => cartAPI.clearCart(),
    onSuccess: () => {
      queryClient.invalidateQueries(['cart']);
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: () => orderAPI.checkout(),
    onSuccess: () => {
      queryClient.invalidateQueries(['cart']);
      queryClient.invalidateQueries(['orders']);
      setIsCheckingOut(false);
      alert('Order placed successfully!');
    },
    onError: (error) => {
      alert('Checkout failed: ' + (error.response?.data?.message || 'Unknown error'));
      setIsCheckingOut(false);
    },
  });

  const handleIncrement = (menuId) => {
    incrementMutation.mutate(menuId);
  };

  const handleDecrement = (menuId) => {
    decrementMutation.mutate(menuId);
  };

  const handleRemoveItem = (cartItemId) => {
    if (window.confirm('Are you sure you want to remove this item?')) {
      removeItemMutation.mutate(cartItemId);
    }
  };

  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      clearCartMutation.mutate();
    }
  };

  const handleCheckout = () => {
    setIsCheckingOut(true);
    checkoutMutation.mutate();
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
        <p className="text-red-500 text-lg">Error loading cart</p>
      </div>
    );
  }

  const cart = cartData?.data?.data;
  const cartItems = cart?.cartItems || [];
  const totalAmount = cart?.totalAmount || 0;

  if (cartItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center space-x-4">
          <Button variant="outline" asChild>
            <Link to="/menu">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Menu
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
        </div>

        <Card className="text-center py-12">
          <CardContent>
            <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">
              Looks like you haven't added any items to your cart yet.
            </p>
            <Button asChild>
              <Link to="/menu">Browse Menu</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" asChild>
            <Link to="/menu">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Menu
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
        </div>
        <Button
          variant="outline"
          onClick={handleClearCart}
          disabled={clearCartMutation.isPending}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Clear Cart
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <img
                    src={item.menu?.imageUrl || '/placeholder-food.jpg'}
                    alt={item.menu?.name}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{item.menu?.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {item.menu?.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDecrement(item.menu?.id)}
                          disabled={decrementMutation.isPending}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-medium w-8 text-center">
                          {item.quantity}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleIncrement(item.menu?.id)}
                          disabled={incrementMutation.isPending}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold">
                          ${item.subTotal?.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-500">
                          ${item.pricePerUnit?.toFixed(2)} each
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRemoveItem(item.id)}
                    disabled={removeItemMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-8">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Items ({cartItems.length})</span>
                <span>${totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Delivery Fee</span>
                <span>$0.00</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax</span>
                <span>$0.00</span>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>${totalAmount.toFixed(2)}</span>
                </div>
              </div>
              
              <Button
                className="w-full"
                size="lg"
                onClick={handleCheckout}
                disabled={isCheckingOut || checkoutMutation.isPending}
              >
                {isCheckingOut || checkoutMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Checkout
                  </>
                )}
              </Button>

              <p className="text-xs text-gray-500 text-center">
                You will be redirected to complete your order
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Cart;
