import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { restaurantBranchAPI } from "../../services/api";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { toast } from "react-toastify";
import { Store, Save } from "lucide-react";

const EditBranchModal = ({ isOpen, onClose, branchData }) => {
    const queryClient = useQueryClient();

    // Form States
    const [formData, setFormData] = useState({
        phoneNumber: "",
        minOrderAmount: 0,
        avgPrepTimeInMinutes: 0,
    });

    useEffect(() => {
        if (isOpen && branchData) {
            setFormData({
                phoneNumber: branchData.phoneNumber || "",
                minOrderAmount: branchData.minOrderAmount || 0,
                avgPrepTimeInMinutes: branchData.avgPrepTimeInMinutes || 0,
            });
        }
    }, [isOpen, branchData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const updateBranchMutation = useMutation({
        mutationFn: (data) => restaurantBranchAPI.updateMyBranch(data),
        onSuccess: () => {
            queryClient.invalidateQueries(["my-branch-details"]);
            toast.success("Branch operational details updated successfully");
            onClose();
        },
        onError: (error) => {
            console.error("Failed to update branch:", error);
            const msg = error.response?.data?.message || "Failed to update branch details";
            toast.error(msg);
        },
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        const payload = {
            phoneNumber: formData.phoneNumber,
            minOrderAmount: parseInt(formData.minOrderAmount),
            avgPrepTimeInMinutes: parseInt(formData.avgPrepTimeInMinutes),
        };

        updateBranchMutation.mutate(payload);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Store className="h-5 w-5" />
                        Edit Branch Operations
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="phoneNumber">Phone Number</Label>
                        <Input
                            id="phoneNumber"
                            name="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="minOrderAmount">Min Order Amount</Label>
                            <Input
                                id="minOrderAmount"
                                name="minOrderAmount"
                                type="number"
                                min="0"
                                value={formData.minOrderAmount}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="avgPrepTimeInMinutes">Avg Prep Time (min)</Label>
                            <Input
                                id="avgPrepTimeInMinutes"
                                name="avgPrepTimeInMinutes"
                                type="number"
                                min="0"
                                value={formData.avgPrepTimeInMinutes}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <DialogFooter className="mt-6">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={updateBranchMutation.isPending}
                            className="gap-2"
                        >
                            {updateBranchMutation.isPending ? (
                                "Saving..."
                            ) : (
                                <>
                                    <Save className="h-4 w-4" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default EditBranchModal;
