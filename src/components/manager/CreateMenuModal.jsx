import React, { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { menuAPI, managerCategoryAPI } from "../../services/api";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose
} from "../ui/dialog";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "react-toastify";

const CreateMenuModal = ({ isOpen, onClose, onSuccess, menuToEdit }) => {
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        categoryId: null,
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState("");

    // Fetch categories for the dropdown
    const { data: categoriesData, isLoading: isCategoriesLoading } = useQuery({
        queryKey: ["manager-categories"],
        queryFn: () => managerCategoryAPI.getManagerCategories(),
        enabled: isOpen, // Only fetch when modal is open
    });

    const categories = categoriesData?.data?.data || [];
    const activeCategories = categories.filter(cat => !cat.deleted);

    // Reset or Populate form when modal opens
    useEffect(() => {
        if (isOpen) {
            if (menuToEdit) {
                setFormData({
                    name: menuToEdit.name || "",
                    description: menuToEdit.description || "",
                    categoryId: menuToEdit.category?.id?.toString() || null, // Ensure string for Select
                });
                // Set existing image as preview if no new file is selected
                setImagePreview(menuToEdit.imageUrl || "");
                setImageFile(null);
            } else {
                setFormData({
                    name: "",
                    description: "",
                    categoryId: null,
                });
                setImageFile(null);
                setImagePreview("");
            }
        }
    }, [isOpen, menuToEdit]);

    const createMenuMutation = useMutation({
        mutationFn: (data) => menuAPI.createMenu(data),
        onSuccess: (data) => {
            toast.success("Menu item created successfully");
            onClose();
            onSuccess();
        },
        onError: (error) => {
            console.error("Failed to create menu", error);
        }
    });

    const updateMenuMutation = useMutation({
        mutationFn: (data) => menuAPI.updateMenu(data),
        onSuccess: (data) => {
            toast.success("Menu item updated successfully");
            onClose();
            onSuccess();
        },
        onError: (error) => {
            console.error("Failed to update menu", error);
        }
    });

    const isEditing = !!menuToEdit;
    const isLoading = createMenuMutation.isPending || updateMenuMutation.isPending;

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCategoryChange = (value) => {
        setFormData(prev => ({ ...prev, categoryId: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validation
        if (!formData.name.trim()) return toast.error("Name is required");
        if (!formData.categoryId) return toast.error("Category is required");

        const data = new FormData();
        // If editing, we MUST include the ID
        if (isEditing) {
            data.append("id", menuToEdit.id);
        }

        data.append("name", formData.name);
        data.append("description", formData.description);
        data.append("categoryId", formData.categoryId);

        if (imageFile) {
            data.append("imageFile", imageFile);
        }

        if (isEditing) {
            updateMenuMutation.mutate(data);
        } else {
            createMenuMutation.mutate(data);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Edit Menu Item" : "Create New Menu Item"}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    {/* Image Upload */}
                    <div className="flex flex-col items-center justify-center gap-4">
                        <div
                            className="w-full h-48 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors relative overflow-hidden"
                            onClick={() => document.getElementById('menu-image-upload').click()}
                        >
                            {imagePreview ? (
                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <div className="flex flex-col items-center text-muted-foreground">
                                    <Upload className="h-8 w-8 mb-2" />
                                    <span>Click to upload image</span>
                                </div>
                            )}
                            <input
                                id="menu-image-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageChange}
                            />
                        </div>
                        {imagePreview && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setImageFile(null);
                                    if (!isEditing) {
                                        setImagePreview("");
                                    } else if (menuToEdit?.imageUrl) {
                                        // If editing and we remove new file, revert to original image
                                        if (imageFile) {
                                            setImagePreview(menuToEdit.imageUrl);
                                        } else {
                                            setImagePreview("");
                                        }
                                    } else {
                                        setImagePreview("");
                                    }
                                }}
                            >
                                {imageFile ? "Remove New Image" : "Remove Image"}
                            </Button>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="name">Item Name</Label>
                        <Input
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder="e.g., Truffle Burger"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            placeholder="Describe the ingredients and taste..."
                            className="resize-none"
                            rows={3}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Category</Label>
                        <Select
                            value={formData.categoryId ? formData.categoryId.toString() : ""}
                            onValueChange={handleCategoryChange}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                                {isCategoriesLoading ? (
                                    <div className="p-2 text-center text-sm text-muted-foreground">Loading categories...</div>
                                ) : activeCategories.length === 0 ? (
                                    <div className="p-2 text-center text-sm text-muted-foreground">No categories found</div>
                                ) : (
                                    activeCategories.map((category) => (
                                        <SelectItem key={category.id} value={category.id.toString()}>
                                            {category.name}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter className="pt-4">
                        <DialogClose asChild>
                            <Button type="button" variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {isEditing ? "Updating..." : "Creating..."}
                                </>
                            ) : (
                                isEditing ? "Update Menu Item" : "Create Menu Item"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default CreateMenuModal;
