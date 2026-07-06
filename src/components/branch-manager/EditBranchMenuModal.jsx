import React, { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { branchManagerAPI } from "../../services/api";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose
} from "../ui/dialog";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";

const EditBranchMenuModal = ({ isOpen, onClose, menuItem, onSuccess }) => {
    const [formData, setFormData] = useState({
        price: "",
        isAvailable: true,
        isHighlighted: false,
    });

    useEffect(() => {
        if (isOpen && menuItem) {
            setFormData({
                price: menuItem.price || "",
                isAvailable: menuItem.available,
                isHighlighted: menuItem.highlighted ?? false,
            });
        }
    }, [isOpen, menuItem]);

    const updateBranchMenuMutation = useMutation({
        mutationFn: (data) => branchManagerAPI.updateBranchMenu(data),
        onSuccess: () => {
            toast.success("Menu item updated successfully");
            onClose();
            onSuccess();
        },
        onError: (error) => {
            console.error("Failed to update menu item", error);
        }
    });

    const isLoading = updateBranchMenuMutation.isPending;

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (checked) => {
        setFormData(prev => ({ ...prev, isAvailable: checked }));
    };

    const handleHighlightedChange = (checked) => {
        setFormData(prev => ({ ...prev, isHighlighted: checked }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formData.price || parseFloat(formData.price) <= 0) {
            return toast.error("Valid price is required");
        }

        const data = new FormData();
        data.append("id", menuItem.id);
        data.append("price", formData.price);
        data.append("available", formData.isAvailable);
        data.append("highlighted", formData.isHighlighted);

        updateBranchMenuMutation.mutate(data);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Menu Item: {menuItem?.name}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="price">Price (ALL)</Label>
                        <Input
                            id="price"
                            name="price"
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.price}
                            onChange={handleInputChange}
                            placeholder="e.g., 1250.00"
                        />
                    </div>

                    <div className="flex items-center space-x-2 py-2">
                        <Checkbox
                            id="isAvailable"
                            checked={formData.isAvailable}
                            onCheckedChange={handleCheckboxChange}
                        />
                        <Label htmlFor="isAvailable" className="cursor-pointer">
                            Available for customers
                        </Label>
                    </div>

                    <div className="flex items-center space-x-2 py-2">
                        <Checkbox
                            id="isHighlighted"
                            checked={formData.isHighlighted}
                            onCheckedChange={handleHighlightedChange}
                        />
                        <Label htmlFor="isHighlighted" className="cursor-pointer">
                            Highlighted (shown in featured carousel)
                        </Label>
                    </div>

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                "Save Changes"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default EditBranchMenuModal;
