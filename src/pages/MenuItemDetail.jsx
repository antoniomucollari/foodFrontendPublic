import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { menuAPI, reviewAPI, cartAPI, orderAPI } from "../services/api";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Star,
  ArrowLeft,
  Plus,
  Minus,
  ShoppingCart,
  Clock,
  User,
  MessageSquare,
  Package,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";

const MenuItemDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { showSuccess, showError } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [newReview, setNewReview] = useState({
    rating: 0,
    comment: "",
    menuId: parseInt(id),
    orderId: null,
  });
  const [hoveredRating, setHoveredRating] = useState(0);
  const queryClient = useQueryClient();

  // Fetch menu item details
  const {
    data: menuData,
    isLoading: menuLoading,
    error: menuError,
  } = useQuery({
    queryKey: ["menu-item", id],
    queryFn: () => menuAPI.getMenuById(id),
  });

  // Fetch reviews for this menu item
  const { data: reviewsData, isLoading: reviewsLoading } = useQuery({
    queryKey: ["reviews", id],
    queryFn: () => reviewAPI.getReviewsForMenu(id),
  });

  // Fetch average rating
  const { data: averageRatingData } = useQuery({
    queryKey: ["average-rating", id],
    queryFn: () => reviewAPI.getAverageRating(id),
  });

  // Fetch cart data
  const { data: cartData } = useQuery({
    queryKey: ["cart"],
    queryFn: () => cartAPI.getShoppingCart(),
    enabled: isAuthenticated(),
    retry: (failureCount, error) => {
      // Don't retry if it's a 404 (cart doesn't exist) or 401 (unauthorized)
      if (error?.response?.status === 404 || error?.response?.status === 401) {
        return false;
      }
      return failureCount < 2;
    },
    onError: (error) => {
      // Silently handle cart errors for new users
      if (error?.response?.status === 404) {
        console.log("Cart not found - user likely doesn't have a cart yet");
      }
    },
  });

  // Fetch user's delivered orders that contain this menu item
  const { data: ordersData } = useQuery({
    queryKey: ["user-orders-for-review", id],
    queryFn: () => orderAPI.getMyOrders(),
    enabled: isAuthenticated(),
  });

  // Mutations
  const addToCartMutation = useMutation({
    mutationFn: (cartData) => cartAPI.addToCart(cartData),
    onSuccess: () => {
      queryClient.invalidateQueries(["cart"]);
      showSuccess("Item added to cart successfully!");
    },
    onError: (error) => {
      // Error is handled by global error handler
      console.error("Add to cart error:", error);
    },
  });

  const incrementMutation = useMutation({
    mutationFn: (menuId) => cartAPI.incrementItem(menuId),
    onSuccess: () => {
      queryClient.invalidateQueries(["cart"]);
      showSuccess("Quantity updated!");
    },
    onError: (error) => {
      // Error is handled by global error handler
      console.error("Increment error:", error);
    },
  });

  const decrementMutation = useMutation({
    mutationFn: (menuId) => cartAPI.decrementItem(menuId),
    onSuccess: () => {
      queryClient.invalidateQueries(["cart"]);
      showSuccess("Quantity updated!");
    },
    onError: (error) => {
      // Error is handled by global error handler
      console.error("Decrement error:", error);
    },
  });

  const createReviewMutation = useMutation({
    mutationFn: (reviewData) => reviewAPI.createReview(reviewData),
    onSuccess: () => {
      queryClient.invalidateQueries(["reviews", id]);
      queryClient.invalidateQueries(["average-rating", id]);
      setNewReview({ rating: 0, comment: "", menuId: parseInt(id) });
    },
  });

  const menuItem = menuData?.data?.data;
  const reviews = reviewsData?.data?.data || [];
  const averageRating = averageRatingData?.data?.data || 0;
  const cartQuantity =
    cartData?.data?.data?.cartItems?.find(
      (item) => item.menu?.id === parseInt(id)
    )?.quantity || 0;

  // Filter delivered orders that contain this menu item
  const deliveredOrdersWithItem =
    ordersData?.data?.data?.content?.filter(
      (order) =>
        order.orderStatus === "DELIVERED" &&
        order.orderItems?.some((item) => item.menu?.id === parseInt(id))
    ) || [];

  const handleAddToCart = () => {
    if (isAuthenticated()) {
      addToCartMutation.mutate({
        menuId: parseInt(id),
        quantity: quantity,
      });
    } else {
      navigate("/login");
    }
  };

  const handleIncrement = () => {
    if (isAuthenticated()) {
      incrementMutation.mutate(parseInt(id));
    } else {
      navigate("/login");
    }
  };

  const handleDecrement = () => {
    if (isAuthenticated()) {
      decrementMutation.mutate(parseInt(id));
    } else {
      navigate("/login");
    }
  };

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (newReview.rating === 0) {
      alert("Please select a rating");
      return;
    }
    if (!selectedOrderId) {
      alert("Please select an order to review");
      return;
    }
    createReviewMutation.mutate({
      ...newReview,
      orderId: parseInt(selectedOrderId),
    });
  };

  const handleRatingClick = (rating) => {
    setNewReview({
      ...newReview,
      rating: rating,
    });
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

  if (menuLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (menuError || !menuItem) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Menu Item Not Found
          </h1>
          <Button onClick={() => navigate("/discovery")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Menu
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-8">
        <Button variant="outline" onClick={() => navigate("/discovery")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Menu
        </Button>
        <h1 className="text-3xl font-bold text-foreground">
          Menu Item Details
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Menu Item Info */}
        <div className="space-y-6">
          <Card>
            <div className="aspect-square overflow-hidden rounded-t-lg">
              <img
                src={menuItem.imageUrl || "/placeholder-food.jpg"}
                alt={menuItem.name}
                className="w-full h-full object-cover"
              />
            </div>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">
                    {menuItem.name}
                  </h2>
                  <p className="text-muted-foreground mt-2">
                    {menuItem.description}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Star className="h-5 w-5 text-yellow-400 fill-current" />
                    <span className="text-lg font-semibold text-foreground">
                      {averageRating > 0
                        ? averageRating.toFixed(1)
                        : "No rating"}
                    </span>
                    <span className="text-muted-foreground">
                      ({reviews.length} reviews)
                    </span>
                  </div>
                  <div className="text-3xl font-bold text-primary">
                    ${menuItem.price?.toFixed(2)}
                  </div>
                </div>

                {/* Add to Cart Section */}
                {isAuthenticated() ? (
                  <div className="space-y-4">
                    {cartQuantity === 0 && (
                      <div className="flex items-center space-x-4">
                        <Label htmlFor="quantity">Quantity:</Label>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setQuantity(Math.max(1, quantity - 1))
                            }
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-12 text-center">{quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setQuantity(quantity + 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {cartQuantity > 0 ? (
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleDecrement}
                            disabled={decrementMutation.isPending}
                            className="transition-all duration-200 hover:scale-110 active:scale-95"
                          >
                            <Minus
                              className={`h-4 w-4 transition-transform duration-200 ${decrementMutation.isPending
                                  ? "animate-pulse"
                                  : ""
                                }`}
                            />
                          </Button>
                          <span className="w-12 text-center font-medium">
                            {cartQuantity}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleIncrement}
                            disabled={incrementMutation.isPending}
                            className="transition-all duration-200 hover:scale-110 active:scale-95"
                          >
                            <Plus
                              className={`h-4 w-4 transition-transform duration-200 ${incrementMutation.isPending
                                  ? "animate-pulse"
                                  : ""
                                }`}
                            />
                          </Button>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          in cart
                        </span>
                      </div>
                    ) : (
                      <Button
                        onClick={handleAddToCart}
                        disabled={addToCartMutation.isPending}
                        className="w-full transition-all duration-200 hover:scale-105 active:scale-95"
                      >
                        <ShoppingCart
                          className={`h-4 w-4 mr-2 transition-transform duration-200 ${addToCartMutation.isPending ? "animate-spin" : ""
                            }`}
                        />
                        {addToCartMutation.isPending
                          ? "Adding..."
                          : "Add to Cart"}
                      </Button>
                    )}
                  </div>
                ) : (
                  <Button onClick={() => navigate("/login")} className="w-full">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Login to Add to Cart
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Write Review Section */}
          {isAuthenticated() && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5" />
                  <span>Write a Review</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {deliveredOrdersWithItem.length === 0 ? (
                  <div className="text-center py-6">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-2">
                      No delivered orders found
                    </p>
                    <p className="text-sm text-muted-foreground">
                      You can only review items from orders that have been
                      delivered.
                    </p>
                    <Button
                      onClick={() => navigate("/orders")}
                      variant="outline"
                      className="mt-4"
                    >
                      View My Orders
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleReviewSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="orderSelect">
                        Select Order to Review *
                      </Label>
                      <select
                        id="orderSelect"
                        value={selectedOrderId}
                        onChange={(e) => setSelectedOrderId(e.target.value)}
                        className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground shadow-sm hover:shadow-md transition-all duration-200 focus:border-transparent cursor-pointer"
                        required
                      >
                        <option value="">Choose an order...</option>
                        {deliveredOrdersWithItem.map((order) => (
                          <option key={order.id} value={order.id}>
                            Order #{order.id} -{" "}
                            {new Date(order.orderDate).toLocaleDateString()}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label>Rating *</Label>
                      <div className="flex space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => handleRatingClick(star)}
                            onMouseEnter={() => setHoveredRating(star)}
                            onMouseLeave={() => setHoveredRating(0)}
                            className="focus:outline-none"
                          >
                            <Star
                              className={`h-8 w-8 transition-colors ${star <= (hoveredRating || newReview.rating)
                                  ? "text-yellow-400 fill-current"
                                  : "text-muted-foreground hover:text-yellow-300"
                                }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="comment">Comment</Label>
                      <textarea
                        id="comment"
                        value={newReview.comment}
                        onChange={(e) =>
                          setNewReview({
                            ...newReview,
                            comment: e.target.value,
                          })
                        }
                        placeholder="Share your experience with this dish..."
                        rows={3}
                        maxLength={500}
                        className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring resize-none bg-background text-foreground"
                      />
                      <p className="text-xs text-muted-foreground">
                        {newReview.comment.length}/500 characters
                      </p>
                    </div>

                    <Button
                      type="submit"
                      disabled={
                        createReviewMutation.isPending ||
                        newReview.rating === 0 ||
                        !selectedOrderId
                      }
                      className="w-full"
                    >
                      {createReviewMutation.isPending
                        ? "Submitting..."
                        : "Submit Review"}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Reviews Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Star className="h-5 w-5" />
                <span>Customer Reviews ({reviews.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reviewsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : reviews.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No reviews yet. Be the first to review!
                </p>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className="border-b border-border pb-4 last:border-b-0"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm text-foreground">
                            {review.userName?.firstName || "Anonymous"}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${i < review.rating
                                  ? "text-yellow-400 fill-current"
                                  : "text-muted-foreground"
                                }`}
                            />
                          ))}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-foreground text-sm mb-2">
                          {review.comment}
                        </p>
                      )}
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{formatDate(review.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MenuItemDetail;
