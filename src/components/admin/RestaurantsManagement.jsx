import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { restaurantsAPI } from "../../services/api";
import { getPageContent, getPageMeta } from "../../utils/apiResponse";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Checkbox } from "../ui/checkbox";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "../ui/alert-dialog";
import {
    Store,
    User,
    Calendar,
    MapPin,
    Crown,
    UserPlus,
    UserMinus,
    Trash2,
    ArchiveRestore,
} from "lucide-react";

const RestaurantsManagement = () => {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [unassignDialogOpen, setUnassignDialogOpen] = useState(false);
    const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
    const [restaurantToDelete, setRestaurantToDelete] = useState(null);
    const [restaurantToUnassign, setRestaurantToUnassign] = useState(null);
    const [restaurantToRestore, setRestaurantToRestore] = useState(null);
    const [showDeleted, setShowDeleted] = useState(false);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(20);
    const queryClient = useQueryClient();

    const { data: restaurantsData, isLoading, error } = useQuery({
        queryKey: ["admin-restaurants", showDeleted, page, pageSize],
        queryFn: () => restaurantsAPI.getAllRestaurantsAdmin(showDeleted, { page, size: pageSize }),
    });

    const restaurants = getPageContent(restaurantsData);
    const restaurantsPage = getPageMeta(restaurantsData);

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: (restaurantId) => restaurantsAPI.deleteRestaurant(restaurantId),
        onSuccess: () => {
            queryClient.invalidateQueries(["admin-restaurants"]);
            setDeleteDialogOpen(false);
            setRestaurantToDelete(null);
        },
        onError: (error) => {
            console.error("Failed to delete restaurant:", error);
        },
    });

    // Unassign mutation
    const unassignMutation = useMutation({
        mutationFn: (restaurantId) => restaurantsAPI.unassignRestaurant(restaurantId),
        onSuccess: () => {
            queryClient.invalidateQueries(["admin-restaurants"]);
            setUnassignDialogOpen(false);
            setRestaurantToUnassign(null);
        },
        onError: (error) => {
            console.error("Failed to unassign manager:", error);
        },
    });

    // Restore mutation
    const restoreMutation = useMutation({
        mutationFn: (restaurantId) => restaurantsAPI.restoreRestaurant(restaurantId),
        onSuccess: () => {
            queryClient.invalidateQueries(["admin-restaurants"]);
            setRestoreDialogOpen(false);
            setRestaurantToRestore(null);
        },
        onError: (error) => {
            console.error("Failed to restore restaurant:", error);
        },
    });

    const handleDeleteClick = (restaurant) => {
        setRestaurantToDelete(restaurant);
        setDeleteDialogOpen(true);
    };

    const handleUnassignClick = (restaurant) => {
        setRestaurantToUnassign(restaurant);
        setUnassignDialogOpen(true);
    };

    const handleRestoreClick = (restaurant) => {
        setRestaurantToRestore(restaurant);
        setRestoreDialogOpen(true);
    };

    const handleConfirmDelete = () => {
        if (restaurantToDelete) {
            deleteMutation.mutate(restaurantToDelete.id);
        }
    };

    const handleConfirmUnassign = () => {
        if (restaurantToUnassign) {
            unassignMutation.mutate(restaurantToUnassign.id);
        }
    };

    const handleConfirmRestore = () => {
        if (restaurantToRestore) {
            restoreMutation.mutate(restaurantToRestore.id);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    if (isLoading) {
        return (
            <div className="p-6 w-full">
                <div className="flex items-center justify-center min-h-96">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 w-full">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center py-8">
                            <p className="text-red-500 mb-4">
                                {error?.response?.data?.message || "Failed to load restaurants."}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6 w-full">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Restaurants Management</h1>
                    <p className="text-muted-foreground">
                        Manage all restaurants and their assigned managers
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Checkbox
                        id="show-deleted"
                        checked={showDeleted}
                        onCheckedChange={(checked) => {
                            setShowDeleted(Boolean(checked));
                            setPage(0);
                        }}
                    />
                    <label
                        htmlFor="show-deleted"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                        Show deleted restaurants
                    </label>
                </div>
            </div>

            {/* Restaurants Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Store className="h-5 w-5" />
                        All Restaurants ({restaurantsPage.totalElements})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-end mb-4">
                        <select
                            value={pageSize}
                            onChange={(e) => {
                                setPageSize(parseInt(e.target.value, 10));
                                setPage(0);
                            }}
                            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                                        Restaurant
                                    </th>
                                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                                        Status
                                    </th>
                                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                                        Branches
                                    </th>
                                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                                        Manager
                                    </th>
                                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                                        Created
                                    </th>
                                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {restaurants.length > 0 ? (
                                    restaurants.map((restaurant) => (
                                        <tr
                                            key={restaurant.id}
                                            className="border-b border-border/50 hover:bg-muted/50 transition-colors"
                                        >
                                            {/* Restaurant Name & Image */}
                                            <td className="py-3 px-4">
                                                <div className="flex items-center space-x-3">
                                                    {restaurant.profileImageUrl ? (
                                                        <img
                                                            src={restaurant.profileImageUrl}
                                                            alt={restaurant.name}
                                                            className="h-10 w-10 rounded-full object-cover border-2 border-border"
                                                            onError={(e) => {
                                                                e.target.src = "/placeholder-restaurant.jpg";
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                                                            <Store className="h-5 w-5 text-primary" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-medium">{restaurant.name}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            ID: {restaurant.id}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Promoted Status */}
                                            <td className="py-3 px-4">
                                                {restaurant.promoted ? (
                                                    <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                                        <Crown className="h-3 w-3 mr-1" />
                                                        Promoted
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline">Regular</Badge>
                                                )}
                                            </td>

                                            {/* Number of Branches */}
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                                    <span>{restaurant.numberOfBranches}</span>
                                                </div>
                                            </td>

                                            {/* Manager */}
                                            <td className="py-3 px-4">
                                                {restaurant.managerId ? (
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-4 w-4 text-muted-foreground" />
                                                        <div>
                                                            <p className="text-sm font-medium">
                                                                {restaurant.managerFullName}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                ID: {restaurant.managerId}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-muted-foreground italic">
                                                        No manager assigned
                                                    </span>
                                                )}
                                            </td>

                                            {/* Created At */}
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                                    <span className="text-sm">
                                                        {formatDate(restaurant.createdAt)}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Actions */}
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    {restaurant.managerId && !restaurant.deleted && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                                                            title="Unassign Manager"
                                                            onClick={() => handleUnassignClick(restaurant)}
                                                        >
                                                            <UserMinus className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    {!restaurant.managerId && !restaurant.deleted && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 w-8 p-0"
                                                            title="Assign Manager"
                                                        >
                                                            <UserPlus className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    {restaurant.deleted ? (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
                                                            title="Restore Restaurant"
                                                            onClick={() => handleRestoreClick(restaurant)}
                                                        >
                                                            <ArchiveRestore className="h-4 w-4" />
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                                                            title="Delete Restaurant"
                                                            onClick={() => handleDeleteClick(restaurant)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="text-center py-8">
                                            <p className="text-muted-foreground">
                                                No restaurants found
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {restaurantsPage.totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                            <div className="text-sm text-muted-foreground">
                                Page {restaurantsPage.number + 1} of {restaurantsPage.totalPages}
                            </div>
                            <div className="flex space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage((current) => Math.max(current - 1, 0))}
                                    disabled={restaurantsPage.first || page === 0}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        setPage((current) =>
                                            Math.min(current + 1, restaurantsPage.totalPages - 1)
                                        )
                                    }
                                    disabled={restaurantsPage.last || page >= restaurantsPage.totalPages - 1}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action will delete the restaurant <strong>{restaurantToDelete?.name}</strong>.
                            This is a dangerous operation and should be done with caution.
                            {restaurantToDelete?.numberOfBranches > 0 && (
                                <span className="block mt-2 text-red-600 dark:text-red-400">
                                    Warning: This restaurant has {restaurantToDelete.numberOfBranches} branch(es) associated with it.
                                </span>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending ? "Deleting..." : "Delete Restaurant"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Unassign Manager Confirmation Dialog */}
            <AlertDialog open={unassignDialogOpen} onOpenChange={setUnassignDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Unassign Manager</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to unassign <strong>{restaurantToUnassign?.managerFullName}</strong> from <strong>{restaurantToUnassign?.name}</strong>?
                            <span className="block mt-2 text-muted-foreground">
                                The manager will be removed from this restaurant but their account will remain active.
                            </span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmUnassign}
                            className="bg-orange-600 hover:bg-orange-700 focus:ring-orange-600"
                            disabled={unassignMutation.isPending}
                        >
                            {unassignMutation.isPending ? "Unassigning..." : "Unassign Manager"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Restore Restaurant Confirmation Dialog */}
            <AlertDialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Restore Restaurant</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to restore <strong>{restaurantToRestore?.name}</strong>?
                            <span className="block mt-2 text-muted-foreground">
                                This will make the restaurant active and accessible again.
                            </span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmRestore}
                            className="bg-green-600 hover:bg-green-700 focus:ring-green-600"
                            disabled={restoreMutation.isPending}
                        >
                            {restoreMutation.isPending ? "Restoring..." : "Restore Restaurant"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default RestaurantsManagement;
