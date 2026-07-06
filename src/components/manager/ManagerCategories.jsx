import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { managerCategoryAPI, userAPI } from "../../services/api";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Plus, Pencil, Trash2, AlertTriangle, Loader2, RefreshCcw } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
    DialogDescription,
    DialogFooter
} from "../ui/dialog";
import { toast } from "react-toastify";

const ManagerCategories = () => {
    const queryClient = useQueryClient();
    const [userId, setUserId] = useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const [newCategoryName, setNewCategoryName] = useState("");
    const [editingCategory, setEditingCategory] = useState({ id: null, name: "" });
    const [deletingCategory, setDeletingCategory] = useState({ id: null, name: "" });

    // Fetch User Details to get User ID
    const { data: userDetails, isLoading: isUserLoading } = useQuery({
        queryKey: ["user-details-full"],
        queryFn: () => userAPI.getOwnAccountDetails(),
    });

    useEffect(() => {
        if (userDetails?.data?.data?.id) {
            setUserId(userDetails.data.data.id);
        }
    }, [userDetails]);

    // Fetch Categories
    const { data: categoriesData, isLoading: isCategoriesLoading } = useQuery({
        queryKey: ["manager-categories"],
        queryFn: () => managerCategoryAPI.getManagerCategories(),
    });

    // Create Category Mutation
    const createCategoryMutation = useMutation({
        mutationFn: (data) => managerCategoryAPI.createCategory(data),
        onSuccess: () => {
            queryClient.invalidateQueries(["manager-categories"]);
            setIsAddModalOpen(false);
            setNewCategoryName("");
            toast.success("Category created successfully");
        },
        onError: (error) => {
            console.error("Failed to create category", error);
        }
    });

    // Update Category Mutation
    const updateCategoryMutation = useMutation({
        mutationFn: (data) => managerCategoryAPI.updateCategory(data),
        onSuccess: () => {
            queryClient.invalidateQueries(["manager-categories"]);
            setIsEditModalOpen(false);
            setEditingCategory({ id: null, name: "" });
            toast.success("Category updated successfully");
        },
        onError: (error) => {
            console.error("Failed to update category", error);
        }
    });

    // Delete Category Mutation
    const deleteCategoryMutation = useMutation({
        mutationFn: (id) => managerCategoryAPI.deleteCategory(id),
        onSuccess: () => {
            queryClient.invalidateQueries(["manager-categories"]);
            setIsDeleteModalOpen(false);
            setDeletingCategory({ id: null, name: "" });
            toast.success("Category marked as deleted");
        },
        onError: (error) => {
            console.error("Failed to delete category", error);
            toast.error("Failed to delete category");
        }
    });

    // Restore Category Mutation
    const restoreCategoryMutation = useMutation({
        mutationFn: (id) => managerCategoryAPI.restoreCategory(id),
        onSuccess: () => {
            queryClient.invalidateQueries(["manager-categories"]);
            toast.success("Category restored successfully");
        },
        onError: (error) => {
            console.error("Failed to restore category", error);
            toast.error("Failed to restore category");
        }
    });

    const handleCreateCategory = (e) => {
        e.preventDefault();
        if (!newCategoryName.trim()) {
            toast.error("Category name is required");
            return;
        }
        createCategoryMutation.mutate({ name: newCategoryName });
    };

    const handleUpdateCategory = (e) => {
        e.preventDefault();
        if (!editingCategory.name.trim()) {
            toast.error("Category name is required");
            return;
        }
        updateCategoryMutation.mutate({ id: editingCategory.id, name: editingCategory.name });
    };

    const handleDeleteCategory = () => {
        if (deletingCategory.id) {
            deleteCategoryMutation.mutate(deletingCategory.id);
        }
    };

    const handleRestoreCategory = (category) => {
        restoreCategoryMutation.mutate(category.id);
    };

    const openEditModal = (category) => {
        setEditingCategory({ id: category.id, name: category.name });
        setIsEditModalOpen(true);
    };

    const openDeleteModal = (category) => {
        setDeletingCategory({ id: category.id, name: category.name });
        setIsDeleteModalOpen(true);
    };

    if (isUserLoading) {
        return <div className="p-6 flex justify-center"><Loader2 className="animate-spin h-8 w-8" /></div>;
    }

    // Categories list
    const categories = categoriesData?.data?.data || [];

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
                    <p className="text-muted-foreground">Manage your restaurant's menu categories</p>
                </div>

                {/* ADD CATEGORY MODAL */}
                <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Category
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Category</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreateCategory} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="categoryName">Name</Label>
                                <Input
                                    id="categoryName"
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    placeholder="e.g., Burgers, Drinks"
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <DialogClose asChild>
                                    <Button type="button" variant="outline">Cancel</Button>
                                </DialogClose>
                                <Button type="submit" disabled={createCategoryMutation.isPending}>
                                    {createCategoryMutation.isPending ? "Creating..." : "Create"}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* EDIT CATEGORY MODAL */}
                <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Category</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleUpdateCategory} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="editCategoryName">Name</Label>
                                <Input
                                    id="editCategoryName"
                                    value={editingCategory.name}
                                    onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                                    placeholder="Category Name"
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={updateCategoryMutation.isPending}>
                                    {updateCategoryMutation.isPending ? "Saving..." : "Save Changes"}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* DELETE CONFIRMATION MODAL */}
                <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Delete Category</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete the category "{deletingCategory.name}"? This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
                            <Button variant="destructive" onClick={handleDeleteCategory} disabled={deleteCategoryMutation.isPending}>
                                {deleteCategoryMutation.isPending ? "Deleting..." : "Delete"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {!userId ? (
                <div className="p-6 bg-red-50 text-red-600 rounded-lg">
                    Error loading user profile. Please try refreshing.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {isCategoriesLoading ? (
                        <div className="col-span-full flex justify-center py-10">
                            <Loader2 className="animate-spin h-8 w-8 text-primary" />
                        </div>
                    ) : categories.length === 0 ? (
                        <div className="col-span-full text-center py-10 text-muted-foreground">
                            No categories found. Create your first one!
                        </div>
                    ) : (
                        categories.map((category) => (
                            <Card
                                key={category.id}
                                className={`transition-shadow ${category.deleted ? "opacity-60 bg-muted/40" : "hover:shadow-md"}`}
                            >
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className={`text-lg font-medium ${category.deleted ? "line-through text-muted-foreground" : ""}`}>
                                        {category.name}
                                    </CardTitle>
                                    <div className="flex items-center gap-1">
                                        {!category.deleted && (
                                            <>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                    onClick={() => openEditModal(category)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                    onClick={() => openDeleteModal(category)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </>
                                        )}
                                        {category.deleted && (
                                            <div className="flex items-center gap-1">
                                                <span className="text-xs text-muted-foreground italic flex items-center mr-1">
                                                    <AlertTriangle className="h-3 w-3 mr-1" /> Deleted
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-green-600"
                                                    onClick={() => handleRestoreCategory(category)}
                                                    title="Restore Category"
                                                    disabled={restoreCategoryMutation.isPending}
                                                >
                                                    <RefreshCcw className={`h-4 w-4 ${restoreCategoryMutation.isPending ? "animate-spin" : ""}`} />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-xs text-muted-foreground">
                                        ID: {category.id}
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default ManagerCategories;
