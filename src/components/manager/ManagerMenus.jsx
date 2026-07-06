import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { menuAPI } from "../../services/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Loader2, Plus, Search, UtensilsCrossed, AlertCircle, Trash2 } from "lucide-react";
import { toast } from "react-toastify";

import CreateMenuModal from "./CreateMenuModal";
import MenuOptionsModal from "./MenuOptionsModal";

const ManagerMenus = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingMenu, setEditingMenu] = useState(null);
    const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
    const [selectedMenuForOptions, setSelectedMenuForOptions] = useState(null);
    const queryClient = useQueryClient();

    // Fetch Menus (myMenus=true)
    const { data: menusData, isLoading, isError } = useQuery({
        queryKey: ["manager-menus", searchTerm],
        queryFn: () => menuAPI.getMenus({
            myMenus: true,
            searchTerm: searchTerm || undefined
        }),
    });

    const menus = menusData?.data?.data || [];

    const deleteMenuMutation = useMutation({
        mutationFn: (id) => menuAPI.deleteMenu(id),
        onSuccess: () => {
            queryClient.invalidateQueries(["manager-menus"]);
            toast.success("Menu item deleted");
        },
        onError: (error) => {
            const message = error?.response?.data?.message || "Failed to delete menu item";
            toast.error(message);
        },
    });

    const handleDelete = (menu) => {
        if (
            window.confirm(
                `Delete "${menu.name}"? This cannot be undone.`
            )
        ) {
            deleteMenuMutation.mutate(menu.id);
        }
    };

    const handleEdit = (menu) => {
        setEditingMenu(menu);
        setIsCreateModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsCreateModalOpen(false);
        setEditingMenu(null);
    };

    const handleOptionsClick = (menu) => {
        setSelectedMenuForOptions(menu);
        setIsOptionsModalOpen(true);
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Menus</h1>
                    <p className="text-muted-foreground">Manage your restaurant's menu items</p>
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Menu Item
                </Button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 bg-muted/20 p-4 rounded-lg border">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search menus..."
                        className="pl-8 bg-background"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Menus Grid */}
            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="animate-spin h-8 w-8 text-primary" />
                </div>
            ) : isError ? (
                <div className="flex flex-col items-center justify-center py-12 text-destructive">
                    <AlertCircle className="h-12 w-12 mb-4" />
                    <h3 className="text-lg font-semibold">Failed to load menus</h3>
                    <p>Please try again later.</p>
                </div>
            ) : menus.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground bg-muted/10 rounded-lg border border-dashed">
                    <UtensilsCrossed className="h-12 w-12 mb-4 opacity-20" />
                    <h3 className="text-lg font-semibold">No menus found</h3>
                    <p className="max-w-xs text-center mt-2">
                        Get started by adding your first menu item.
                    </p>
                    <Button variant="outline" className="mt-6" onClick={() => setIsCreateModalOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Menu Item
                    </Button>
                </div>
            ) : (
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px]">Image</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow >
                        </TableHeader >
                        <TableBody>
                            {menus.map((menu) => (
                                <TableRow key={menu.id}>
                                    <TableCell>
                                        <img
                                            src={menu.imageUrl || "https://placehold.co/600x400?text=No+Image"}
                                            alt={menu.name}
                                            className="h-12 w-12 rounded-md object-cover"
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">{menu.name}</TableCell>
                                    <TableCell>
                                        <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${menu.category?.deleted
                                            ? "bg-destructive/10 text-destructive border-destructive/20"
                                            : "bg-secondary text-secondary-foreground border-transparent"
                                            }`}>
                                            {menu.category?.deleted && <AlertCircle className="mr-1 h-3 w-3" />}
                                            {menu.category?.name || "Uncategorized"}
                                            {menu.category?.deleted && " (Deleted)"}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="line-clamp-1 text-muted-foreground" title={menu.description}>
                                            {menu.description || "-"}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="outline" size="sm" onClick={() => handleOptionsClick(menu)}>
                                                Options
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleEdit(menu)}>
                                                Edit
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                disabled={
                                                    deleteMenuMutation.isPending &&
                                                    deleteMenuMutation.variables === menu.id
                                                }
                                                onClick={() => handleDelete(menu)}
                                                title="Delete menu item"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table >
                </div >
            )}
            {/* Create Menu Modal */}
            <CreateMenuModal
                isOpen={isCreateModalOpen}
                onClose={handleCloseModal}
                menuToEdit={editingMenu}
                onSuccess={() => {
                    queryClient.invalidateQueries(["manager-menus"]);
                }}
            />

            {/* Menu Options Modal */}
            <MenuOptionsModal
                isOpen={isOptionsModalOpen}
                onClose={() => setIsOptionsModalOpen(false)}
                menuId={selectedMenuForOptions?.id}
                menuName={selectedMenuForOptions?.name}
            />
        </div >
    );
};

export default ManagerMenus;
