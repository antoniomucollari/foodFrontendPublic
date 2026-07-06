import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { menuAPI } from "../../services/api";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Loader2, Plus, Trash2, Link2Off, Pencil, Link, RotateCcw } from "lucide-react";
import { Switch } from "../ui/switch";
import { toast } from "react-toastify";

const MenuOptionsModal = ({ isOpen, onClose, menuId, menuName }) => {
    const queryClient = useQueryClient();
    const [name, setName] = useState("");
    const [minSelection, setMinSelection] = useState(0);
    const [maxSelection, setMaxSelection] = useState(1);
    const [editingOptionId, setEditingOptionId] = useState(null);
    const [variants, setVariants] = useState([{ name: "", price: 0, deleted: false }]);
    const [showArchived, setShowArchived] = useState(false);

    // Fetch existing options
    const { data: optionsData, isLoading: isLoadingOptions } = useQuery({
        queryKey: ["menu-options", menuId],
        queryFn: () => menuAPI.getManagerMenuOptions(menuId),
        enabled: !!menuId && isOpen,
    });

    const options = React.useMemo(() => {
        const rawData = optionsData?.data?.data || [];
        // Adapt fields from new API structure to component's expected structure
        return rawData.map(opt => ({
            ...opt,
            variants: (opt.variants || []).map(v => ({
                ...v,
                id: v.variantId || v.id,
                recommendedPrice: v.globalPrice !== undefined ? v.globalPrice : (v.recommendedPrice || v.price || 0),
                // Preserve other fields
            }))
        }));
    }, [optionsData]);

    // Fetch available options
    const { data: availableOptionsData, isLoading: isLoadingAvailable } = useQuery({
        queryKey: ["available-options", menuId],
        queryFn: () => menuAPI.getAvailableOptions(menuId),
        enabled: !!menuId && isOpen,
    });

    const availableOptions = React.useMemo(() => {
        const rawData = availableOptionsData?.data?.data || [];
        return rawData.map(opt => ({
            ...opt,
            variants: (opt.variants || []).map(v => ({
                ...v,
                id: v.variantId || v.id,
                recommendedPrice: v.globalPrice !== undefined ? v.globalPrice : (v.recommendedPrice || v.price || 0),
            }))
        }));
    }, [availableOptionsData]);

    // Add Option Mutation
    // Add Option Mutation
    const addOptionMutation = useMutation({
        mutationFn: (data) => menuAPI.addMenuOption(menuId, data),
        onSuccess: () => {
            queryClient.invalidateQueries(["menu-options", menuId]);
            toast.success("Option group added successfully");
            resetForm();
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to add option group");
        },
    });

    // Edit Option Mutation
    const editOptionMutation = useMutation({
        mutationFn: (data) => menuAPI.editMenuOption(data),
        onSuccess: () => {
            queryClient.invalidateQueries(["menu-options", menuId]);
            queryClient.invalidateQueries(["available-options", menuId]); // Also refersh available options
            toast.success("Option group updated successfully");
            resetForm();
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to update option group");
        },
    });

    // Delete Option Mutation
    const deleteOptionMutation = useMutation({
        mutationFn: (optionId) => menuAPI.deleteOption(optionId),
        onSuccess: () => {
            queryClient.invalidateQueries(["menu-options", menuId]);
            toast.success("Option group deleted successfully");
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to delete option group");
        },
    });

    const resetForm = () => {
        setName("");
        setMinSelection(0);
        setMaxSelection(1);
        setVariants([{ name: "", price: 0, deleted: false }]);
        setEditingOptionId(null);
    };

    // Unlink Option Mutation
    const unlinkOptionMutation = useMutation({
        mutationFn: ({ menuId, optionId }) => menuAPI.unlinkOptionFromMenu(menuId, optionId),
        onSuccess: () => {
            queryClient.invalidateQueries(["menu-options", menuId]);
            toast.success("Option group unlinked successfully");
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to unlink option group");
        },
    });

    // Link Option Mutation
    const linkOptionMutation = useMutation({
        mutationFn: ({ menuId, optionId }) => menuAPI.linkOptionToMenu(menuId, optionId),
        onSuccess: () => {
            queryClient.invalidateQueries(["menu-options", menuId]);
            queryClient.invalidateQueries(["available-options", menuId]);
            toast.success("Option group linked successfully");
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to link option group");
        },
    });

    const handleLink = (optionId) => {
        linkOptionMutation.mutate({ menuId, optionId });
    };

    const handleUnlink = (optionId) => {
        if (window.confirm("Are you sure you want to unlink this option group from this menu?")) {
            unlinkOptionMutation.mutate({ menuId, optionId });
        }
    };

    const handleDelete = (optionId) => {
        if (window.confirm("DANGER: Are you sure you want to DELETE this option group? This will remove it from ALL menus!")) {
            deleteOptionMutation.mutate(optionId);
        }
    };

    const handleRestore = (option) => {
        if (window.confirm("Are you sure you want to restore this option group?")) {
            const payload = {
                id: option.id,
                name: option.name,
                minSelection: option.minSelection,
                maxSelection: option.maxSelection,
                deleted: false,
                variants: option.variants?.map(v => ({
                    id: v.id,
                    name: v.name,
                    recommendedPrice: v.recommendedPrice,
                    deleted: v.deleted
                })) || []
            };
            editOptionMutation.mutate(payload);
        }
    };

    const handleEdit = (option) => {
        // Reset form first to clear any potential stale state
        resetForm();

        if (window.confirm("Warning! Changing this will affect ALL menus that use this group.")) {
            setEditingOptionId(option.id);
            setName(option.name);
            setMinSelection(option.minSelection);
            setMaxSelection(option.maxSelection);

            // Map variants back to form format
            // API returns 'recommendedPrice' but form uses 'price'
            const formattedVariants = option.variants?.map(v => ({
                id: v.id,
                name: v.name,
                price: v.recommendedPrice || 0,
                deleted: v.deleted || false
            })) || [{ name: "", price: 0, deleted: false }];

            setVariants(formattedVariants);
            // Scroll to form
            document.querySelector('form')?.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const handleAddVariant = () => {
        setVariants([...variants, { name: "", price: 0 }]);
    };

    const handleRemoveVariant = (index) => {
        const newVariants = [...variants];
        newVariants.splice(index, 1);
        setVariants(newVariants);
    };

    const handleVariantChange = (index, field, value) => {
        const newVariants = [...variants];
        newVariants[index][field] = value;
        setVariants(newVariants);
    };

    const handleCancelEdit = () => {
        resetForm();
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validation
        if (!name.trim()) return toast.error("Option group name is required");
        if (variants.some(v => !v.name.trim())) return toast.error("All variants must have a name");

        // Format data matches: 
        // { "name": "...", "minSelection": 1, "maxSelection": 1, "variants": [{ "name": "...", "price": 0 }] }
        if (editingOptionId) {
            const payload = {
                id: editingOptionId,
                name,
                minSelection: parseInt(minSelection),
                maxSelection: parseInt(maxSelection),
                variants: variants.map(v => ({
                    ...(v.id && { id: v.id }),
                    name: v.name,
                    recommendedPrice: parseFloat(v.price),
                    deleted: v.deleted || false
                }))
            };
            editOptionMutation.mutate(payload);
        } else {
            const payload = {
                name,
                minSelection: parseInt(minSelection),
                maxSelection: parseInt(maxSelection),
                variants: variants.map(v => ({
                    name: v.name,
                    recommendedPrice: parseFloat(v.price)
                }))
            };
            addOptionMutation.mutate(payload);
        }
    };

    // Filter options based on showArchived toggle
    const filteredOptions = options.filter(opt =>
        showArchived ? opt.deleted : !opt.deleted
    );
    const filteredAvailableOptions = availableOptions.filter(opt =>
        showArchived ? opt.deleted : !opt.deleted
    );

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Manage Options for {menuName}</DialogTitle>
                </DialogHeader>

                {/* Archive Toggle - Applies to all sections */}
                <div className="flex items-center justify-end space-x-2 pb-2 border-b">
                    <Label htmlFor="archive-mode" className="text-sm">
                        {showArchived ? "Showing: Archived / Deleted" : "Showing: Active Options"}
                    </Label>
                    <Switch
                        id="archive-mode"
                        checked={showArchived}
                        onCheckedChange={setShowArchived}
                    />
                </div>

                <div className="space-y-6">
                    {/* Existing Options List */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Existing Options</h3>
                        {isLoadingOptions ? (
                            <div className="flex justify-center p-4">
                                <Loader2 className="animate-spin h-6 w-6" />
                            </div>
                        ) : filteredOptions.length > 0 ? (
                            <div className="grid gap-4">
                                {filteredOptions.map((opt) => (
                                    <div key={opt.id} className={`border p-4 rounded-lg ${showArchived ? 'bg-muted/50 opacity-75' : 'bg-card'}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h4 className="font-bold">{opt.name}</h4>
                                                <p className="text-sm text-muted-foreground">
                                                    Select: {opt.minSelection} - {opt.maxSelection}
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                {showArchived ? (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleRestore(opt)}
                                                        disabled={editOptionMutation.isPending}
                                                        className="text-green-600 border-green-200 hover:bg-green-50"
                                                    >
                                                        <RotateCcw className="h-4 w-4 mr-2" />
                                                        Restore
                                                    </Button>
                                                ) : (
                                                    <>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            title="Edit Option Group"
                                                            onClick={() => handleEdit(opt)}
                                                        >
                                                            <Pencil className="h-4 w-4 text-blue-500" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            title="Unlink from Menu"
                                                            onClick={() => handleUnlink(opt.id)}
                                                            disabled={unlinkOptionMutation.isPending}
                                                        >
                                                            <Link2Off className="h-4 w-4 text-orange-500" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            title="Delete Option Group"
                                                            onClick={() => handleDelete(opt.id)}
                                                            disabled={deleteOptionMutation.isPending}
                                                        >
                                                            <Trash2 className="h-4 w-4 text-red-600" />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="pl-4 border-l-2 border-muted mt-2">
                                            {opt.variants?.map((v, i) => (
                                                <div key={i} className="flex justify-between text-sm py-1">
                                                    <span>{v.name}</span>
                                                    <span className="font-mono">
                                                        {v.recommendedPrice > 0 ? `+${v.recommendedPrice} ALL` : 'Free'}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground italic">
                                {showArchived ? "No archived options linked to this menu." : "No options configured yet."}
                            </p>
                        )}
                    </div>

                    {/* Available Options List */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Link Available Options</h3>

                        {isLoadingAvailable ? (
                            <div className="flex justify-center p-4">
                                <Loader2 className="animate-spin h-6 w-6" />
                            </div>
                        ) : filteredAvailableOptions.length > 0 ? (
                            <div className="grid gap-4">
                                {filteredAvailableOptions.map((opt) => (
                                    <div key={opt.id} className={`border p-4 rounded-lg ${showArchived ? 'bg-muted/50 opacity-75' : 'bg-card/50'}`}>
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h4 className="font-bold">{opt.name}</h4>
                                                <p className="text-sm text-muted-foreground">
                                                    Select: {opt.minSelection} - {opt.maxSelection} | Variants: {opt.variants?.length || 0}
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                {showArchived ? (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleRestore(opt)}
                                                        disabled={editOptionMutation.isPending}
                                                        className="text-green-600 border-green-200 hover:bg-green-50"
                                                    >
                                                        <RotateCcw className="h-4 w-4 mr-2" />
                                                        Restore
                                                    </Button>
                                                ) : (
                                                    <>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            title="Edit Option Group"
                                                            onClick={() => handleEdit(opt)}
                                                        >
                                                            <Pencil className="h-4 w-4 text-blue-500" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            title="Delete Option Group"
                                                            onClick={() => handleDelete(opt.id)}
                                                            disabled={deleteOptionMutation.isPending}
                                                        >
                                                            <Trash2 className="h-4 w-4 text-red-600" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="secondary"
                                                            onClick={() => handleLink(opt.id)}
                                                            disabled={linkOptionMutation.isPending}
                                                        >
                                                            <Link className="h-4 w-4 mr-2" />
                                                            Link
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        {/* Show variants for available options too */}
                                        <div className="pl-4 border-l-2 border-muted mt-2">
                                            {opt.variants?.map((v, i) => (
                                                <div key={i} className="flex justify-between text-sm py-1">
                                                    <span>{v.name}</span>
                                                    <span className="font-mono">
                                                        {v.recommendedPrice > 0 ? `+${v.recommendedPrice} ALL` : 'Free'}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground italic text-sm">
                                {showArchived ? "No archived options found." : "No available active options found."}
                            </p>
                        )}
                    </div>

                    <div className="border-t pt-6"></div>

                    {/* Add/Edit Option Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold">
                                {editingOptionId ? "Edit Option Group" : "Add New Option Group"}
                            </h3>
                            {editingOptionId && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleCancelEdit}
                                    className="text-muted-foreground"
                                >
                                    Cancel Edit
                                </Button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Group Name</Label>
                                <Input
                                    placeholder="e.g. Choose Sauce"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Min Selection</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={minSelection}
                                    onChange={(e) => setMinSelection(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Max Selection</Label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={maxSelection}
                                    onChange={(e) => setMaxSelection(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <Label>Variants</Label>
                                <Button type="button" variant="outline" size="sm" onClick={handleAddVariant}>
                                    <Plus className="h-4 w-4 mr-2" /> Add Variant
                                </Button>
                            </div>

                            {variants.map((variant, index) => (
                                <div key={index} className="flex items-center gap-3">
                                    <Input
                                        placeholder="Variant Name"
                                        className="flex-1"
                                        value={variant.name}
                                        onChange={(e) => handleVariantChange(index, 'name', e.target.value)}
                                    />
                                    <div className="w-32 relative">
                                        <Input
                                            type="number"
                                            placeholder="Price"
                                            min="0"
                                            value={variant.price}
                                            onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">ALL</span>
                                    </div>
                                    {variants.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive"
                                            onClick={() => handleRemoveVariant(index)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <Button
                            type="submit"
                            disabled={addOptionMutation.isPending || editOptionMutation.isPending}
                            className="w-full"
                        >
                            {(addOptionMutation.isPending || editOptionMutation.isPending) && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            {editingOptionId ? "Update Option Group" : "Save Option Group"}
                        </Button>
                    </form>
                </div>
            </DialogContent>
        </Dialog >
    );
};

export default MenuOptionsModal;
