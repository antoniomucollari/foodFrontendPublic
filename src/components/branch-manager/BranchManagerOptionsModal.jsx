import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { branchManagerAPI } from "../../services/api";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Loader2, Save } from "lucide-react";
import { Switch } from "../ui/switch";
import { toast } from "react-toastify";

const BranchManagerOptionsModal = ({ isOpen, onClose, menuId, menuName }) => {
    const queryClient = useQueryClient();
    const [showUnavailable, setShowUnavailable] = useState(false);
    const [editedVariants, setEditedVariants] = useState({});

    // Fetch branch options
    const { data: optionsData, isLoading } = useQuery({
        queryKey: ["branch-menu-options", menuId],
        queryFn: () => branchManagerAPI.getBranchMenuOptions(menuId),
        enabled: !!menuId && isOpen,
    });

    const options = optionsData?.data?.data || [];

    // Filter options based on availability toggle
    const filteredOptions = useMemo(() => {
        if (showUnavailable) {
            // Show only options that have at least one unavailable variant
            return options.filter(opt =>
                opt.variants?.some(v => !v.available)
            );
        }
        // Show only options that have at least one available variant
        return options.filter(opt =>
            opt.variants?.some(v => v.available)
        );
    }, [options, showUnavailable]);

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: ({ optionId, updates }) =>
            branchManagerAPI.updateBranchOptionConfig(optionId, updates),
        onSuccess: () => {
            queryClient.invalidateQueries(["branch-menu-options", menuId]);
            toast.success("Option configuration updated successfully");
            setEditedVariants({});
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to update option configuration");
        },
    });

    const handleVariantChange = (optionId, variantId, field, value) => {
        const key = `${optionId}-${variantId}`;
        setEditedVariants(prev => ({
            ...prev,
            [key]: {
                ...prev[key],
                optionId,
                variantId,
                [field]: value,
            }
        }));
    };

    const getVariantValue = (optionId, variantId, field, defaultValue) => {
        const key = `${optionId}-${variantId}`;
        return editedVariants[key]?.[field] ?? defaultValue;
    };

    const hasChanges = (optionId) => {
        return Object.keys(editedVariants).some(key =>
            editedVariants[key].optionId === optionId
        );
    };

    const handleSave = (optionId) => {
        const updates = Object.values(editedVariants)
            .filter(edit => edit.optionId === optionId)
            .map(edit => ({
                variantId: edit.variantId,
                price: edit.price !== undefined ? parseFloat(edit.price) : undefined,
                isAvailable: edit.isAvailable !== undefined ? edit.isAvailable : undefined,
            }));

        if (updates.length === 0) {
            toast.info("No changes to save");
            return;
        }

        updateMutation.mutate({ optionId, updates });
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('sq-AL', {
            style: 'currency',
            currency: 'ALL',
            minimumFractionDigits: 2,
        }).format(price);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Manage Options for {menuName}</DialogTitle>
                </DialogHeader>

                {/* Availability Filter Toggle */}
                <div className="flex items-center justify-end space-x-2 pb-2 border-b">
                    <Label htmlFor="availability-filter" className="text-sm">
                        {showUnavailable ? "Showing: Unavailable Options" : "Showing: Available Options"}
                    </Label>
                    <Switch
                        id="availability-filter"
                        checked={showUnavailable}
                        onCheckedChange={setShowUnavailable}
                    />
                </div>

                <div className="space-y-6">
                    {isLoading ? (
                        <div className="flex justify-center p-4">
                            <Loader2 className="animate-spin h-6 w-6" />
                        </div>
                    ) : filteredOptions.length > 0 ? (
                        <div className="grid gap-6">
                            {filteredOptions.map((option) => (
                                <div key={option.id} className="border rounded-lg p-4 bg-card">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h4 className="font-bold text-lg">{option.name}</h4>
                                            <p className="text-sm text-muted-foreground">
                                                Select: {option.minSelection} - {option.maxSelection}
                                            </p>
                                        </div>
                                        {hasChanges(option.id) && (
                                            <Button
                                                size="sm"
                                                onClick={() => handleSave(option.id)}
                                                disabled={updateMutation.isPending}
                                            >
                                                {updateMutation.isPending ? (
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                ) : (
                                                    <Save className="h-4 w-4 mr-2" />
                                                )}
                                                Save Changes
                                            </Button>
                                        )}
                                    </div>

                                    {/* Variants Table */}
                                    <div className="space-y-2">
                                        <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-muted/50 rounded-md font-medium text-sm">
                                            <div className="col-span-4">Variant Name</div>
                                            <div className="col-span-3 text-right">Global Price</div>
                                            <div className="col-span-3 text-right">Branch Price</div>
                                            <div className="col-span-2 text-center">Available</div>
                                        </div>
                                        {option.variants?.map((variant) => {
                                            const currentPrice = getVariantValue(
                                                option.id,
                                                variant.variantId,
                                                'price',
                                                variant.price
                                            );
                                            const currentAvailable = getVariantValue(
                                                option.id,
                                                variant.variantId,
                                                'isAvailable',
                                                variant.available
                                            );

                                            return (
                                                <div
                                                    key={variant.variantId}
                                                    className={`grid grid-cols-12 gap-4 px-4 py-3 border rounded-md items-center ${!currentAvailable ? 'bg-muted/30 opacity-60' : ''
                                                        }`}
                                                >
                                                    <div className="col-span-4 font-medium">
                                                        {variant.name}
                                                        {variant.overwritten && (
                                                            <span className="ml-2 text-xs px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded">
                                                                Custom
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="col-span-3 text-right text-muted-foreground">
                                                        {formatPrice(variant.globalPrice)}
                                                    </div>
                                                    <div className="col-span-3">
                                                        <div className="relative">
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                value={currentPrice}
                                                                onChange={(e) => handleVariantChange(
                                                                    option.id,
                                                                    variant.variantId,
                                                                    'price',
                                                                    e.target.value
                                                                )}
                                                                className="text-right pr-12"
                                                            />
                                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                                                ALL
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="col-span-2 flex justify-center">
                                                        <Switch
                                                            checked={currentAvailable}
                                                            onCheckedChange={(checked) => handleVariantChange(
                                                                option.id,
                                                                variant.variantId,
                                                                'isAvailable',
                                                                checked
                                                            )}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground italic text-center py-8">
                            {showUnavailable
                                ? "No unavailable options found for this menu item."
                                : "No available options found for this menu item."}
                        </p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default BranchManagerOptionsModal;
