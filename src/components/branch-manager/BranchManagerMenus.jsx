import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { branchManagerAPI } from "../../services/api";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../ui/table";
import { Loader2, UtensilsCrossed, AlertCircle, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import CreateBranchMenuModal from "./CreateBranchMenuModal";
import BranchManagerOptionsModal from "./BranchManagerOptionsModal";
import EditBranchMenuModal from "./EditBranchMenuModal";

const BranchManagerMenus = () => {
    const [currentPage, setCurrentPage] = useState(0);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedMenuForOptions, setSelectedMenuForOptions] = useState(null);
    const [selectedMenuForEdit, setSelectedMenuForEdit] = useState(null);
    const pageSize = 10;

    // Fetch Menus
    const { data: menusData, isLoading, isError, refetch } = useQuery({
        queryKey: ["branch-manager-menus", currentPage],
        queryFn: () => branchManagerAPI.getMenus({
            page: currentPage,
            size: pageSize
        }),
    });

    const menus = menusData?.data?.data?.content || [];
    const totalPages = menusData?.data?.data?.totalPages || 0;
    const totalElements = menusData?.data?.data?.totalElements || 0;
    const pageFromResponse = menusData?.data?.data?.number;
    const effectivePage = Number.isInteger(pageFromResponse) ? pageFromResponse : currentPage;
    const isFirstPage = menusData?.data?.data?.first ?? effectivePage <= 0;
    const isLastPage = menusData?.data?.data?.last ?? (totalPages <= 1 || effectivePage >= totalPages - 1);

    const handlePreviousPage = () => {
        if (!isFirstPage) {
            setCurrentPage(prev => prev - 1);
        }
    };

    const handleNextPage = () => {
        if (!isLastPage) {
            setCurrentPage(prev => prev + 1);
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('sq-AL', {
            style: 'currency',
            currency: 'ALL',
            minimumFractionDigits: 2,
        }).format(price);
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Menu Items</h1>
                    <p className="text-muted-foreground">View and manage your branch's menu items</p>
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Menu Item
                </Button>
            </div>

            {/* Menu Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Menu Items ({totalElements})</CardTitle>
                </CardHeader>
                <CardContent>
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
                            <h3 className="text-lg font-semibold">No menu items found</h3>
                            <p className="max-w-xs text-center mt-2">
                                No menu items available for your branch.
                            </p>
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[100px]">Image</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Price</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead className="text-center">Available</TableHead>
                                        <TableHead className="text-center">Highlighted</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {menus.map((menu) => (
                                        <TableRow key={menu.id}>
                                            <TableCell>
                                                <img
                                                    src={menu.imageUrl || "https://placehold.co/100x100?text=No+Image"}
                                                    alt={menu.name}
                                                    className="w-16 h-16 object-cover rounded-md"
                                                    onError={(e) => {
                                                        e.target.src = "https://placehold.co/100x100?text=No+Image";
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell className="font-medium">{menu.name}</TableCell>
                                            <TableCell>{formatPrice(menu.price)}</TableCell>
                                            <TableCell>
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                                    {menu.categoryName || "Uncategorized"}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {menu.available ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                                        Yes
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                                                        No
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {menu.highlighted ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                                                        Yes
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
                                                        No
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedMenuForOptions(menu);
                                                        setIsOptionsModalOpen(true);
                                                    }}
                                                >
                                                    Options
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="ml-2"
                                                    onClick={() => {
                                                        setSelectedMenuForEdit(menu);
                                                        setIsEditModalOpen(true);
                                                    }}
                                                >
                                                    Edit
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between px-2 py-4 border-t">
                                    <div className="text-sm text-muted-foreground">
                                        Page {effectivePage + 1} of {totalPages}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handlePreviousPage}
                                            disabled={isFirstPage}
                                        >
                                            <ChevronLeft className="h-4 w-4 mr-1" />
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleNextPage}
                                            disabled={isLastPage}
                                        >
                                            Next
                                            <ChevronRight className="h-4 w-4 ml-1" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Create Menu Modal */}
            <CreateBranchMenuModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => {
                    refetch();
                    setIsCreateModalOpen(false);
                }}
            />

            {/* Branch Manager Options Modal */}
            <BranchManagerOptionsModal
                isOpen={isOptionsModalOpen}
                onClose={() => setIsOptionsModalOpen(false)}
                menuId={selectedMenuForOptions?.id}
                menuName={selectedMenuForOptions?.name}
            />

            {/* Edit Branch Menu Modal */}
            <EditBranchMenuModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                menuItem={selectedMenuForEdit}
                onSuccess={() => {
                    refetch();
                }}
            />
        </div>
    );
};

export default BranchManagerMenus;
