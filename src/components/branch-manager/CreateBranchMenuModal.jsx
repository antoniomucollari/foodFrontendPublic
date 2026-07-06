import React, { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { branchManagerAPI } from "../../services/api";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
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
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";

const CreateBranchMenuModal = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        menuId: null,
        name: "",
        price: "",
        isAvailable: true,
        isHighlighted: false,
    });

    // Fetch restaurant menus for the dropdown
    const { data: restaurantMenusData, isLoading: isMenusLoading } = useQuery({
        queryKey: ["restaurant-menus"],
        queryFn: () => branchManagerAPI.getRestaurantMenus(),
        enabled: isOpen, // Only fetch when modal is open
    });

    const restaurantMenus = restaurantMenusData?.data?.data || [];

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setFormData({
                menuId: null,
                name: "",
                price: "",
                isAvailable: true,
                isHighlighted: false,
            });
        }
    }, [isOpen]);

    const createBranchMenuMutation = useMutation({
        mutationFn: (data) => branchManagerAPI.createBranchMenu(data),
        onSuccess: (data) => {
            toast.success("Branch menu item created successfully");
            onClose();
            onSuccess();
        },
        onError: (error) => {
            console.error("Failed to create branch menu item", error);
        }
    });

    const isLoading = createBranchMenuMutation.isPending;

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleMenuChange = (value) => {
        const selectedMenu = restaurantMenus.find(menu => menu.id.toString() === value);
        if (selectedMenu) {
            setFormData(prev => ({
                ...prev,
                menuId: value,
                name: selectedMenu.name // Pre-fill the name
            }));
        }
    };

    const handleCheckboxChange = (field, checked) => {
        setFormData(prev => ({ ...prev, [field]: checked }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validation
        if (!formData.menuId) return toast.error("Please select a parent menu");
        if (!formData.name.trim()) return toast.error("Name is required");
        if (!formData.price || parseFloat(formData.price) <= 0) return toast.error("Valid price is required");

        const data = new FormData();
        data.append("menuId", formData.menuId);
        data.append("name", formData.name);
        data.append("price", formData.price);
        data.append("isAvailable", formData.isAvailable);
        data.append("isHighlighted", formData.isHighlighted);

        createBranchMenuMutation.mutate(data);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create Branch Menu Item</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    {/* Parent Menu Selection */}
                    <div className="space-y-2">
                        <Label>Parent Menu (Restaurant Manager)</Label>
                        <Select
                            value={formData.menuId ? formData.menuId.toString() : ""}
                            onValueChange={handleMenuChange}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a parent menu" />
                            </SelectTrigger>
                            <SelectContent>
                                {isMenusLoading ? (
                                    <div className="p-2 text-center text-sm text-muted-foreground">Loading menus...</div>
                                ) : restaurantMenus.length === 0 ? (
                                    <div className="p-2 text-center text-sm text-muted-foreground">No menus found</div>
                                ) : (
                                    restaurantMenus.map((menu) => (
                                        <SelectItem key={menu.id} value={menu.id.toString()}>
                                            {menu.name}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
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

                    <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="isAvailable"
                                checked={formData.isAvailable}
                                onCheckedChange={(checked) => handleCheckboxChange("isAvailable", checked)}
                            />
                            <Label htmlFor="isAvailable" className="cursor-pointer">
                                Available for customers
                            </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="isHighlighted"
                                checked={formData.isHighlighted}
                                onCheckedChange={(checked) => handleCheckboxChange("isHighlighted", checked)}
                            />
                            <Label htmlFor="isHighlighted" className="cursor-pointer">
                                Highlight this item
                            </Label>
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <DialogClose asChild>
                            <Button type="button" variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                "Create Menu Item"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default CreateBranchMenuModal;
