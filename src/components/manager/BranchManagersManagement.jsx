import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { managerRestaurantAPI, userAPI } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import CreateBranchManagerModal from "./CreateBranchManagerModal";
import {
    Users,
    Search,
    Mail,
    Phone,
    MapPin,
    UserCheck,
    UserX,
    Shield,
    Plus,
    Filter,
    Hash,
    Building2,
    ShieldOff,
    AlertTriangle,
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select";

const BranchManagersManagement = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [filters, setFilters] = useState({
        id: "",
        name: "",
        branchName: "",
        isAssigned: "all" // "all", "true", "false"
    });
    const [selectedUser, setSelectedUser] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const {
        data: managersData,
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: ["branch-managers", filters, user?.restaurantId],
        queryFn: () => managerRestaurantAPI.getBranchManagers({
            id: filters.id || null,
            name: filters.name || null,
            branchName: filters.branchName || null,
            isAssigned: filters.isAssigned === "all" ? null : filters.isAssigned === "true"
        }),
        enabled: !!user?.restaurantId,
    });

    // Toggle account status mutation (activate/deactivate)
    const toggleAccountMutation = useMutation({
        mutationFn: ({ id, action }) => {
            if (action === "activate") {
                return userAPI.restoreBranchManager(id);
            } else {
                return userAPI.deactivateBranchManager(id);
            }
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries(["branch-managers"]);
            // Messages are handled by the API interceptor
        },
        onError: (error) => {
            console.error("Error updating account status:", error);
        },
    });

    const managers = managersData?.data?.data || [];

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const handleToggleAccount = (managerId, isActive) => {
        setSelectedUser({ id: managerId, isActive: isActive });
        setConfirmAction({ action: isActive ? "deactivate" : "activate" });
        setShowConfirmModal(true);
    };

    const handleConfirmAction = async () => {
        if (selectedUser && confirmAction) {
            try {
                await toggleAccountMutation.mutateAsync({
                    id: selectedUser.id,
                    action: confirmAction.action
                });
                setShowConfirmModal(false);
                setConfirmAction(null);
                setSelectedUser(null);
            } catch (error) {
                // Error handled by mutation's onError
            }
        }
    };

    return (
        <div className="space-y-6 p-6 w-full">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">
                        Branch Managers
                    </h1>
                    <p className="text-muted-foreground">
                        View your restaurant's branch managers
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                        {managers.length} manager{managers.length !== 1 ? "s" : ""}
                    </span>
                </div>
            </div>

            {/* Actions Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center">
                            <Users className="h-5 w-5 mr-2" />
                            All Branch Managers
                        </div>
                        <Button onClick={() => setIsCreateModalOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Register Branch Manager
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 bg-muted/30 p-4 rounded-lg border">
                        {/* ID Filter */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                <Hash className="h-3 w-3" /> ID
                            </label>
                            <Input
                                placeholder="Filter by ID..."
                                value={filters.id}
                                onChange={(e) => setFilters(prev => ({ ...prev, id: e.target.value }))}
                                className="h-9"
                                type="number"
                            />
                        </div>

                        {/* Name Filter */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                <Search className="h-3 w-3" /> Name/Email
                            </label>
                            <Input
                                placeholder="Filter by name or email..."
                                value={filters.name}
                                onChange={(e) => setFilters(prev => ({ ...prev, name: e.target.value }))}
                                className="h-9"
                            />
                        </div>

                        {/* Branch Name Filter */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                <Building2 className="h-3 w-3" /> Branch Name
                            </label>
                            <Input
                                placeholder="Filter by branch name..."
                                value={filters.branchName}
                                onChange={(e) => setFilters(prev => ({ ...prev, branchName: e.target.value }))}
                                className="h-9"
                            />
                        </div>

                        {/* Assignment Status Filter */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                <Filter className="h-3 w-3" /> Status
                            </label>
                            <Select
                                value={filters.isAssigned}
                                onValueChange={(value) => setFilters(prev => ({ ...prev, isAssigned: value }))}
                            >
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder="All Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Managers</SelectItem>
                                    <SelectItem value="true">Assigned</SelectItem>
                                    <SelectItem value="false">Unassigned</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {isLoading && (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            <span className="ml-2">Loading managers...</span>
                        </div>
                    )}

                    {error && (
                        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
                            Error loading managers: {error.message}
                        </div>
                    )}

                    {!isLoading && !error && managers.length === 0 && (
                        <div className="text-center py-8">
                            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">
                                {filters.id || filters.name || filters.branchName || filters.isAssigned !== "all"
                                    ? "No managers found matching your filters"
                                    : "No branch managers found."}
                            </p>
                        </div>
                    )}

                    {!isLoading && !error && managers.length > 0 && (
                        <div className="overflow-x-auto rounded-lg border border-border">
                            <table className="w-full border-collapse min-w-[800px]">
                                <thead>
                                    <tr className="border-b border-border bg-muted/50">
                                        <th className="text-left p-4 font-medium text-muted-foreground">
                                            Manager
                                        </th>
                                        <th className="text-left p-4 font-medium text-muted-foreground">
                                            Contact
                                        </th>
                                        <th className="text-left p-4 font-medium text-muted-foreground">
                                            Status
                                        </th>
                                        <th className="text-left p-4 font-medium text-muted-foreground">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {managers.map((manager) => (
                                        <tr
                                            key={manager.id}
                                            className="border-b border-border hover:bg-muted/50"
                                        >
                                            {/* Manager Info */}
                                            <td className="p-4">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-purple-100">
                                                        <Shield className="h-5 w-5 text-purple-600" />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">
                                                            {manager.name || "No Name"}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">
                                                            ID: {manager.id}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Contact Info */}
                                            <td className="p-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center space-x-2 text-sm">
                                                        <Mail className="h-3 w-3 text-muted-foreground" />
                                                        <span className="text-muted-foreground truncate max-w-[200px]">
                                                            {manager.email}
                                                        </span>
                                                    </div>
                                                    {manager.phoneNumber && (
                                                        <div className="flex items-center space-x-2 text-sm">
                                                            <Phone className="h-3 w-3 text-muted-foreground" />
                                                            <span className="text-muted-foreground">
                                                                {manager.phoneNumber}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {manager.address && (
                                                        <div className="flex items-start space-x-2 text-sm">
                                                            <MapPin className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                                                            <span className="text-muted-foreground line-clamp-1 max-w-[200px]">
                                                                {manager.address}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Status */}
                                            <td className="p-4">
                                                <div className="flex items-center space-x-2">
                                                    {manager.active ? (
                                                        <UserCheck className="h-4 w-4 text-green-600" />
                                                    ) : (
                                                        <UserX className="h-4 w-4 text-red-600" />
                                                    )}
                                                    <Badge
                                                        className={`${manager.active
                                                            ? "bg-green-100 text-green-800"
                                                            : "bg-red-100 text-red-800"
                                                            } cursor-default`}
                                                    >
                                                        {manager.active ? "Active" : "Inactive"}
                                                    </Badge>
                                                </div>
                                            </td>

                                            {/* Actions */}
                                            <td className="p-4">
                                                <div className="flex items-center space-x-2">
                                                    <Button
                                                        variant={manager.active ? "destructive" : "default"}
                                                        size="sm"
                                                        onClick={() =>
                                                            handleToggleAccount(manager.id, manager.active)
                                                        }
                                                        disabled={toggleAccountMutation.isPending}
                                                        title={
                                                            manager.active
                                                                ? "Deactivate Account"
                                                                : "Activate Account"
                                                        }
                                                    >
                                                        {manager.active ? (
                                                            <ShieldOff className="h-4 w-4" />
                                                        ) : (
                                                            <UserCheck className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <CreateBranchManagerModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => {
                    refetch();
                }}
            />

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 !m-0">
                    <Card className="w-full max-w-sm mx-4">
                        <CardHeader>
                            <CardTitle className="flex items-center text-destructive">
                                <AlertTriangle className="h-5 w-5 mr-2" />
                                Confirm Action
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">
                                Are you sure you want to{" "}
                                <span className="font-semibold text-foreground">
                                    {confirmAction?.action}
                                </span>{" "}
                                this account?
                            </p>
                            <p className="text-xs text-muted-foreground mb-4">
                                This action will restrict/allow user access.
                            </p>

                            <div className="flex space-x-2">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => {
                                        setShowConfirmModal(false);
                                        setConfirmAction(null);
                                        setSelectedUser(null);
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="destructive"
                                    className="flex-1"
                                    onClick={handleConfirmAction}
                                    disabled={toggleAccountMutation.isPending}
                                >
                                    {toggleAccountMutation.isPending ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <AlertTriangle className="h-4 w-4 mr-2" />
                                            Confirm
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default BranchManagersManagement;
