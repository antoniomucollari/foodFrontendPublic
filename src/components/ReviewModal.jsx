import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { reviewAPI } from "../services/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Star } from "lucide-react";
import { toast } from "react-toastify";

const ReviewModal = ({ isOpen, onClose, order, onSuccess }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const queryClient = useQueryClient();

  // Reset state when modal opens/changes order
  React.useEffect(() => {
    if (isOpen) {
      setRating(5);
      setComment("");
    }
  }, [isOpen, order]);

  const createReviewMutation = useMutation({
    mutationFn: (reviewData) => reviewAPI.createReview(reviewData),
    onSuccess: () => {
      queryClient.invalidateQueries(["orders"]);
      toast.success("Review submitted successfully!");
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (error) => {
      console.error("Review submission failed:", error);
      // Error is handled by global handler, but we can show local error if needed
      // toast.error(error.response?.data?.message || "Failed to submit review");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!order) return;

    createReviewMutation.mutate({
      orderId: order.id,
      rating,
      comment,
    });
  };

  const handleRatingClick = (selectedRating) => {
    setRating(selectedRating);
  };

  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Rate your Order #{order.id}</DialogTitle>
          <DialogDescription>
            {order.branchFullName ? `from ${order.branchFullName}` : ""}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="rating">Rating</Label>
              <div className="flex gap-1" id="rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className="focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-full p-1 transition-transform hover:scale-110"
                    onClick={() => handleRatingClick(star)}
                    aria-label={`Rate ${star} stars`}
                  >
                    <Star
                      className={`h-8 w-8 transition-colors ${star <= rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300 dark:text-gray-600"
                        }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="comment">Comment</Label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write your review here... (optional)"
                maxLength={500}
                className="resize-none h-32"
              />
              <div className="text-xs text-muted-foreground text-right w-full">
                {comment.length}/500
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={createReviewMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createReviewMutation.isPending}>
              {createReviewMutation.isPending ? "Submitting..." : "Submit Review"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewModal;