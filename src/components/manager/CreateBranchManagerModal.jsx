import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { authAPI, managerRestaurantAPI } from "../../services/api";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
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

const CreateBranchManagerModal = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phoneNumber: "",
        address: "",
        branchId: "",
    });

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setFormData({
                name: "",
                email: "",
                phoneNumber: "",
                address: "",
                branchId: "",
            });
        }
    }, [isOpen]);

    // Fetch branches that don't have a manager
    const { data: branchesData, isLoading: isBranchesLoading } = useQuery({
        queryKey: ["available-branches-for-manager"],
        queryFn: () => managerRestaurantAPI.getManagerBranches({ hasManager: false }),
        enabled: isOpen,
    });

    const branches = branchesData?.data?.data || [];

    const createManagerMutation = useMutation({
        mutationFn: (data) => authAPI.createBranchManager(data),
        onSuccess: (data) => {
            toast.success("Branch manager registered successfully");
            onClose();
            onSuccess();
        },
        onError: (error) => {
            console.error("Failed to register branch manager", error);
            // toast.error handles by interceptor usually, but safe to log
        }
    });

    const isLoading = createManagerMutation.isPending;

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleBranchChange = (value) => {
        setFormData(prev => ({ ...prev, branchId: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validation
        if (!formData.name) return toast.error("Name is required");
        if (!formData.email) return toast.error("Email is required");
        if (!formData.branchId) return toast.error("Please assign a branch");

        createManagerMutation.mutate({
            ...formData,
            branchId: parseInt(formData.branchId) // Ensure Long/Integer compatibility
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Register Branch Manager</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder="e.g. John Doe"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="e.g. john@example.com"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="phoneNumber">Phone Number</Label>
                            <Input
                                id="phoneNumber"
                                name="phoneNumber"
                                value={formData.phoneNumber}
                                onChange={handleInputChange}
                                placeholder="e.g. +1234567890"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Input
                                id="address"
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                placeholder="e.g. 123 Main St"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Assign to Branch</Label>
                        <Select
                            value={formData.branchId}
                            onValueChange={handleBranchChange}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a branch..." />
                            </SelectTrigger>
                            <SelectContent>
                                {isBranchesLoading ? (
                                    <div className="p-2 text-center text-sm text-muted-foreground">Loading branches...</div>
                                ) : branches.length === 0 ? (
                                    <div className="p-2 text-center text-sm text-muted-foreground">No unassigned branches found</div>
                                ) : (
                                    branches.map((branch) => (
                                        <SelectItem key={branch.id} value={branch.id.toString()}>
                                            {branch.locationName || branch.address || `Branch #${branch.id}`}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            Only branches without a manager are listed.
                        </p>
                    </div>

                    <DialogFooter className="pt-4">
                        <DialogClose asChild>
                            <Button type="button" variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Registering...
                                </>
                            ) : (
                                "Register Manager"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default CreateBranchManagerModal;
