import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { managerRestaurantAPI, categoryAPI } from "../../services/api";
import { Loader2, Calendar, Star, Building2, Edit2, Save, X } from "lucide-react";
import { toast } from "react-toastify";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";

const MyRestaurant = () => {
    const queryClient = useQueryClient();
    const [isEditCategoriesOpen, setIsEditCategoriesOpen] = useState(false);
    const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);

    const { data, isLoading, error } = useQuery({
        queryKey: ["my-restaurant"],
        queryFn: managerRestaurantAPI.getManagerRestaurant,
    });

    const { data: allCategoriesData } = useQuery({
        queryKey: ["all-categories"],
        queryFn: categoryAPI.getAllCategories,
    });

    const updateCategoriesMutation = useMutation({
        mutationFn: managerRestaurantAPI.updateRestaurantCategories,
        onSuccess: () => {
            toast.success("Categories updated successfully");
            queryClient.invalidateQueries(["my-restaurant"]);
            setIsEditCategoriesOpen(false);
        },
        onError: (error) => {
            console.error("Failed to update categories:", error);
            // Error handling is also done in the global interceptor, but we can show specific message here if needed
        },
    });

    const handleOpenEditCategories = () => {
        if (data?.data?.data?.categories) {
            setSelectedCategoryIds(data.data.data.categories.map((c) => c.id));
        } else {
            setSelectedCategoryIds([]);
        }
        setIsEditCategoriesOpen(true);
    };

    const handleCategoryToggle = (categoryId) => {
        setSelectedCategoryIds((prev) => {
            if (prev.includes(categoryId)) {
                return prev.filter((id) => id !== categoryId);
            } else {
                if (prev.length >= 3) {
                    toast.warning("You can only select up to 3 categories");
                    return prev;
                }
                return [...prev, categoryId];
            }
        });
    };

    const handleSaveCategories = () => {
        updateCategoriesMutation.mutate(selectedCategoryIds);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 text-center text-destructive">
                Error loading restaurant details: {error.message}
            </div>
        );
    }

    const restaurant = data?.data?.data;

    if (!restaurant) {
        return <div className="p-4 text-center">No restaurant found.</div>;
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="relative h-64 md:h-80 w-full rounded-xl overflow-hidden shadow-lg group">
                <img
                    src={restaurant.coverImageUrl || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1974&auto=format&fit=crop"}
                    alt="Restaurant Cover"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-end">
                    <div className="p-6 md:p-8 w-full flex items-end justify-between">
                        <div className="flex items-center gap-6">
                            <div className="relative">
                                <img
                                    src={restaurant.profileImageUrl || "https://via.placeholder.com/150"}
                                    alt={restaurant.name}
                                    className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-background shadow-xl object-cover"
                                />
                                {restaurant.promoted && (
                                    <div className="absolute -top-2 -right-2 bg-yellow-500 text-white p-1.5 rounded-full shadow-lg" title="Promoted">
                                        <Star className="w-4 h-4 fill-current" />
                                    </div>
                                )}
                            </div>
                            <div className="text-white space-y-1 mb-2">
                                <h1 className="text-3xl md:text-4xl font-bold tracking-tight shadow-sm">
                                    {restaurant.name}
                                </h1>
                                <div className="flex items-center gap-4 text-sm md:text-base text-gray-200">
                                    <span className="flex items-center gap-1.5">
                                        <Calendar className="w-4 h-4" />
                                        Since {new Date(restaurant.createdAt).getFullYear()}
                                    </span>
                                    <span className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-xs font-medium border border-white/30">
                                        {restaurant.promoted ? "Promoted Partner" : "Standard Partner"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-card rounded-xl border border-border shadow-sm p-6">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-primary" />
                            About Restaurant
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            {restaurant.description || "No description available."}
                        </p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-card rounded-xl border border-border shadow-sm p-6">
                        <h2 className="text-lg font-semibold mb-4 text-foreground">Details</h2>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                                <span className="text-muted-foreground text-sm">Status</span>
                                <span className="font-medium text-sm">Active</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                                <span className="text-muted-foreground text-sm">ID</span>
                                <span className="font-mono text-xs bg-muted px-2 py-1 rounded">{restaurant.id}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                                <span className="text-muted-foreground text-sm">Joined</span>
                                <span className="font-medium text-sm">{new Date(restaurant.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Categories Section */}
                    <div className="bg-card rounded-xl border border-border shadow-sm p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-foreground">Categories</h2>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleOpenEditCategories}
                                className="h-8 w-8 p-0"
                            >
                                <Edit2 className="h-4 w-4" />
                            </Button>
                        </div>
                        {restaurant.categories && restaurant.categories.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {restaurant.categories.map((category) => (
                                    <span
                                        key={category.id}
                                        className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground"
                                    >
                                        {category.name}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-sm italic">No categories assigned.</p>
                        )}
                    </div>
                </div>
            </div>

            <Dialog open={isEditCategoriesOpen} onOpenChange={setIsEditCategoriesOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Restaurant Categories</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="text-sm text-muted-foreground mb-2">
                            Select up to 3 categories for your restaurant.
                        </div>
                        <div className="grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto p-1">
                            {allCategoriesData?.data?.data?.map((category) => (
                                <div
                                    key={category.id}
                                    className="flex items-center space-x-2 border p-2 rounded-md hover:bg-accent cursor-pointer"
                                    onClick={() => handleCategoryToggle(category.id)}
                                >
                                    <Checkbox
                                        id={`category-${category.id}`}
                                        checked={selectedCategoryIds.includes(category.id)}
                                        onCheckedChange={() => handleCategoryToggle(category.id)}
                                    />
                                    <Label
                                        htmlFor={`category-${category.id}`}
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                    >
                                        {category.name}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </div>
                    <DialogFooter className="sm:justify-between">
                        <div className="text-xs text-muted-foreground self-center">
                            {selectedCategoryIds.length}/3 selected
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setIsEditCategoriesOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleSaveCategories} disabled={updateCategoriesMutation.isPending}>
                                {updateCategoriesMutation.isPending && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Save Changes
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default MyRestaurant;
