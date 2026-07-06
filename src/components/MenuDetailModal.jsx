import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { menuAPI, guestAPI } from "../services/api";
import { Link } from "react-router-dom";
import {
    Dialog,
    DialogContent,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";
import { Loader2, Plus, Minus, X, LogIn } from "lucide-react";

const MenuDetailModal = ({ isOpen, onClose, menuId, branchId, onAddToCart, readOnly = false }) => {
    const [quantity, setQuantity] = useState(1);
    // selectedOptions: { [optionGroupId]: [variantId, ...] }
    const [selectedOptions, setSelectedOptions] = useState({});

    // Fetch menu details
    const { data: menuRes, isLoading: menuLoading } = useQuery({
        queryKey: ["menu-detail", menuId],
        queryFn: () => menuAPI.getMenuById(menuId),
        enabled: !!menuId && isOpen,
    });

    // Fetch menu options
    const { data: optionsRes, isLoading: optionsLoading } = useQuery({
        queryKey: ["menu-options", menuId, branchId],
        queryFn: () => menuAPI.getCustomerMenuOptions(menuId, branchId),
        enabled: !!menuId && !!branchId && isOpen,
    });

    const menu = menuRes?.data?.data;
    const optionsRaw = optionsRes?.data?.data || [];

    // Adapt and filter options
    const activeOptions = useMemo(() => {
        return optionsRaw
            .filter(opt => opt.isDeleted !== true && opt.deleted !== true)
            .map(opt => ({
                ...opt,
                variants: (opt.variants || [])
                    .filter(v => v.isDeleted !== true && v.deleted !== true && v.isAvailable !== false)
                    .map(v => ({
                        ...v,
                        id: v.variantId || v.id,
                        recommendedPrice: v.price !== undefined ? v.price : (v.recommendedPrice || 0)
                    }))
            }));
    }, [optionsRaw]);

    // Validation: check if all mandatory options are satisfied
    const validation = useMemo(() => {
        const errors = [];
        let isValid = true;

        activeOptions.forEach(opt => {
            const selected = selectedOptions[opt.id] || [];
            const count = selected.length;

            if (opt.minSelection > 0 && count < opt.minSelection) {
                isValid = false;
                errors.push(`"${opt.name}" requires at least ${opt.minSelection} selection(s)`);
            }
            if (count > opt.maxSelection) {
                isValid = false;
                errors.push(`"${opt.name}" allows at most ${opt.maxSelection} selection(s)`);
            }
        });

        return { isValid, errors };
    }, [activeOptions, selectedOptions]);

    // Calculate total price (base + variants) * quantity
    const totalPrice = useMemo(() => {
        let base = Number(menu?.price) || 0;

        activeOptions.forEach(opt => {
            const selected = selectedOptions[opt.id] || [];
            selected.forEach(variantId => {
                const variant = opt.variants.find(v => v.id === variantId);
                if (variant) {
                    base += Number(variant.recommendedPrice) || 0;
                }
            });
        });

        return base * quantity;
    }, [menu, activeOptions, selectedOptions, quantity]);

    // Handle variant selection
    const handleVariantToggle = (optionId, variantId, maxSelection) => {
        setSelectedOptions(prev => {
            const current = prev[optionId] || [];

            if (maxSelection === 1) {
                // Radio behavior: replace selection
                return { ...prev, [optionId]: [variantId] };
            }
            //
            // Checkbox behavior
            if (current.includes(variantId)) {
                return { ...prev, [optionId]: current.filter(id => id !== variantId) };
            } else {
                if (current.length < maxSelection) {
                    return { ...prev, [optionId]: [...current, variantId] };
                }
                return prev; // Max reached
            }
        });
    };

    const handleAddToCart = () => {
        if (!validation.isValid) return;

        // Build options array in the format: [{ optionGroupId, variantIds: [...] }, ...]
        const options = Object.entries(selectedOptions).map(([optionGroupId, variantIds]) => ({
            optionGroupId: parseInt(optionGroupId),
            variantIds: variantIds.map(id => parseInt(id)),
        }));

        onAddToCart?.({
            menuId,
            quantity,
            options, // Send options array with grouped variant IDs
        });

        // Reset and close
        setQuantity(1);
        setSelectedOptions({});
        onClose();
    };

    const handleClose = () => {
        setQuantity(1);
        setSelectedOptions({});
        onClose();
    };

    const isLoading = menuLoading || optionsLoading;

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="animate-spin h-8 w-8 text-muted-foreground" />
                    </div>
                ) : menu ? (
                    <div className="flex flex-col max-h-[90vh]">
                        {/* Scrollable Content */}
                        <div className="overflow-y-auto flex-1">
                            {/* Menu Image */}
                            {menu.imageUrl && (
                                <div className="w-full">
                                    <img
                                        src={menu.imageUrl}
                                        alt={menu.name}
                                        className="w-full h-56 sm:h-64 object-cover"
                                    />
                                </div>
                            )}

                            {/* Content */}
                            <div className="p-5 space-y-4">
                                {/* Title */}
                                <h2
                                    className="leading-7 text-foreground"
                                    style={{
                                        fontFamily: "'Rubik', sans-serif",
                                        fontWeight: 900,
                                        fontSize: '24px',
                                        lineHeight: '28px',
                                    }}
                                >
                                    {menu.name}
                                </h2>

                                {/* Price */}
                                <p
                                    style={{
                                        fontFamily: "'Rubik', sans-serif",
                                        fontWeight: 700,
                                        fontSize: '18px'
                                    }}
                                >
                                    {Number(menu.price || 0).toFixed(2)} ALL
                                </p>

                                {/* Description */}
                                {menu.description && (
                                    <p
                                        className="text-muted-foreground"
                                        style={{
                                            fontFamily: "'Rubik', sans-serif",
                                            fontWeight: 400,
                                            fontSize: '16px',
                                            lineHeight: '24px',
                                        }}
                                    >
                                        {menu.description}
                                    </p>
                                )}

                                {/* Options */}
                                {activeOptions.length > 0 && (
                                    <div className="space-y-5 pt-2">
                                        {activeOptions.map(opt => {
                                            const isRequired = opt.minSelection > 0;
                                            const selected = selectedOptions[opt.id] || [];
                                            const isSingleSelect = opt.maxSelection === 1;

                                            return (
                                                <div key={opt.id} className="border-t pt-4">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div>
                                                            <h4 className="font-semibold text-foreground">{opt.name}</h4>
                                                            <p className="text-xs text-muted-foreground">
                                                                Select {opt.minSelection === opt.maxSelection
                                                                    ? opt.minSelection
                                                                    : `${opt.minSelection}-${opt.maxSelection}`
                                                                }
                                                            </p>
                                                        </div>
                                                        <span className={`text-xs px-2 py-1 rounded font-medium ${isRequired
                                                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                                            : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                                                            }`}>
                                                            {isRequired ? "Required" : "Optional"}
                                                        </span>
                                                    </div>

                                                    <div className="space-y-3">
                                                        {isSingleSelect ? (
                                                            <RadioGroup
                                                                value={selected[0]?.toString() || ""}
                                                                onValueChange={(val) => handleVariantToggle(opt.id, parseInt(val), 1)}
                                                            >
                                                                {opt.variants.map(variant => (
                                                                    <div key={variant.id} className="flex items-center justify-between py-1">
                                                                        <div className="flex items-center space-x-3">
                                                                            <RadioGroupItem
                                                                                value={variant.id.toString()}
                                                                                id={`variant-${variant.id}`}
                                                                            />
                                                                            <Label htmlFor={`variant-${variant.id}`} className="cursor-pointer text-sm">
                                                                                {variant.name}
                                                                            </Label>
                                                                        </div>
                                                                        {variant.recommendedPrice > 0 && (
                                                                            <span className="text-sm text-muted-foreground">
                                                                                +{Number(variant.recommendedPrice).toFixed(2)} ALL
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </RadioGroup>
                                                        ) : (
                                                            opt.variants.map(variant => (
                                                                <div key={variant.id} className="flex items-center justify-between py-1">
                                                                    <div className="flex items-center space-x-3">
                                                                        <Checkbox
                                                                            id={`variant-${variant.id}`}
                                                                            checked={selected.includes(variant.id)}
                                                                            onCheckedChange={() => handleVariantToggle(opt.id, variant.id, opt.maxSelection)}
                                                                            disabled={!selected.includes(variant.id) && selected.length >= opt.maxSelection}
                                                                        />
                                                                        <Label htmlFor={`variant-${variant.id}`} className="cursor-pointer text-sm">
                                                                            {variant.name}
                                                                        </Label>
                                                                    </div>
                                                                    {variant.recommendedPrice > 0 && (
                                                                        <span className="text-sm text-muted-foreground">
                                                                            +{Number(variant.recommendedPrice).toFixed(2)} ALL
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Fixed Bottom Bar */}
                        <div className="border-t bg-background p-4">
                            {readOnly ? (
                                /* Guest: show login prompt instead of add-to-cart */
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 flex items-center gap-2 text-sm text-muted-foreground">
                                        <LogIn className="h-4 w-4" />
                                        <span>Log in to add to cart</span>
                                    </div>
                                    <Button asChild className="h-10 bg-primary hover:bg-primary/90">
                                        <Link to="/login">Log In</Link>
                                    </Button>
                                    <Button asChild variant="outline" className="h-10">
                                        <Link to="/register">Register</Link>
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-4">
                                    {/* Quantity Selector */}
                                    <div className="flex items-center border rounded-lg">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-10 w-10 rounded-none"
                                            onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                            disabled={quantity <= 1}
                                        >
                                            <Minus className="h-4 w-4" />
                                        </Button>
                                        <span className="w-10 text-center font-semibold">{quantity}</span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-10 w-10 rounded-none"
                                            onClick={() => setQuantity(q => q + 1)}
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    {/* Add Button */}
                                    <Button
                                        className="flex-1 h-10 bg-amber-500 hover:bg-amber-600 text-white font-semibold"
                                        onClick={handleAddToCart}
                                        disabled={!validation.isValid}
                                    >
                                        <span>Add</span>
                                        <span className="ml-auto">{totalPrice.toFixed(2)} ALL</span>
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8 text-muted-foreground">
                        Menu item not found.
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default MenuDetailModal;
