import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authAPI, userAPI } from "../../services/api";
import { getPageContent, getPageMeta } from "../../utils/apiResponse";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import {
    Users,
    Search,
    Mail,
    Phone,
    MapPin,
    UserCheck,
    UserX,
    UserPlus,
    Shield,
    X,
    ShieldOff,
    AlertTriangle,
} from "lucide-react";
import { toast } from "react-toastify";

const ManagersManagement = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phoneNumber: "",
        address: "",
    });
    const [selectedUser, setSelectedUser] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(20);
    const queryClient = useQueryClient();

    const {
        data: managersData,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["admin-managers", searchTerm, page, pageSize],
        queryFn: () => userAPI.getAllUsers("MANAGER", searchTerm, { page, size: pageSize }),
    });

    const managers = getPageContent(managersData);
    const managersPage = getPageMeta(managersData);

    // Create manager mutation
    const createManagerMutation = useMutation({
        mutationFn: (managerData) => authAPI.registerManager(managerData),
        onSuccess: (data) => {
            console.log("🎉 Manager created successfully:", data);
            queryClient.invalidateQueries(["admin-managers"]);
            setShowCreateModal(false);
            setFormData({ name: "", email: "", phoneNumber: "", address: "" });

            // Show success message with password info
            toast.success(
                "Manager created successfully! An auto-generated password has been sent to their email."
            );
        },
        onError: (error) => {
            console.error("❌ Error creating manager:", error);
            // Error message will be handled by the global error handler
        },
    });

    // Toggle account status mutation (activate/deactivate)
    const toggleAccountMutation = useMutation({
        mutationFn: ({ id, action }) => {
            if (action === "activate") {
                return userAPI.restoreUsers(id);
            } else {
                return userAPI.deactivateAccount(id);
            }
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries(["admin-managers"]);
            // Messages are handled by the API interceptor
        },
        onError: (error) => {
            console.error("Error updating account status:", error);
        },
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Basic validation
        if (!formData.name.trim()) {
            toast.error("Name is required");
            return;
        }
        if (!formData.email.trim()) {
            toast.error("Email is required");
            return;
        }

        // Prepare data (remove empty optional fields)
        const submitData = {
            name: formData.name.trim(),
            email: formData.email.trim(),
        };

        if (formData.phoneNumber.trim()) {
            submitData.phoneNumber = formData.phoneNumber.trim();
        }
        if (formData.address.trim()) {
            submitData.address = formData.address.trim();
        }

        createManagerMutation.mutate(submitData);
    };

    const handleToggleAccount = (userId, isActive) => {
        const action = isActive ? "deactivate" : "activate";
        setSelectedUser({ id: userId, active: isActive });
        setConfirmAction({ type: "toggleAccount", action });
        setShowConfirmModal(true);
    };

    const handleConfirmAction = () => {
        if (confirmAction && selectedUser) {
            if (confirmAction.type === "toggleAccount") {
                toggleAccountMutation.mutate({
                    id: selectedUser.id,
                    action: confirmAction.action
                });
            }
        }
        setShowConfirmModal(false);
        setConfirmAction(null);
        setSelectedUser(null);
    };

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

    return (
        <div className="space-y-6 p-6 w-full">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">
                        Manager Management
                    </h1>
                    <p className="text-muted-foreground">
                        Manage restaurant managers and their accounts
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                        {managersPage.totalElements} manager{managersPage.totalElements !== 1 ? "s" : ""}
                    </span>
                </div>
            </div>

            {/* Actions Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center">
                            <Users className="h-5 w-5 mr-2" />
                            All Managers
                        </div>
                        <Button onClick={() => setShowCreateModal(true)}>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Create Manager
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Search */}
                    <div className="flex items-center space-x-4 mb-6">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search managers by name or email..."
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setPage(0);
                                    }}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <select
                            value={pageSize}
                            onChange={(e) => {
                                setPageSize(parseInt(e.target.value, 10));
                                setPage(0);
                            }}
                            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
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
                                {searchTerm
                                    ? "No managers found matching your search"
                                    : "No managers found. Create one to get started!"}
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

                    {!isLoading && !error && managersPage.totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                            <div className="text-sm text-muted-foreground">
                                Page {managersPage.number + 1} of {managersPage.totalPages}
                            </div>
                            <div className="flex space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage((current) => Math.max(current - 1, 0))}
                                    disabled={managersPage.first || page === 0}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        setPage((current) =>
                                            Math.min(current + 1, managersPage.totalPages - 1)
                                        )
                                    }
                                    disabled={managersPage.last || page >= managersPage.totalPages - 1}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create Manager Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 !m-0">
                    <Card className="w-full max-w-md mx-4">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <UserPlus className="h-5 w-5 mr-2" />
                                    Create New Manager
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setFormData({
                                            name: "",
                                            email: "",
                                            phoneNumber: "",
                                            address: "",
                                        });
                                    }}
                                    disabled={createManagerMutation.isPending}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                                    <p className="text-sm text-blue-800">
                                        <strong>Note:</strong> A secure password will be
                                        auto-generated and sent to the manager's email address.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="name">
                                        Name <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        type="text"
                                        placeholder="John Doe"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">
                                        Email <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="manager@example.com"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phoneNumber">Phone Number</Label>
                                    <Input
                                        id="phoneNumber"
                                        name="phoneNumber"
                                        type="tel"
                                        placeholder="+1234567890"
                                        value={formData.phoneNumber}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="address">Address</Label>
                                    <Input
                                        id="address"
                                        name="address"
                                        type="text"
                                        placeholder="123 Main St, City, Country"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div className="flex space-x-2 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => {
                                            setShowCreateModal(false);
                                            setFormData({
                                                name: "",
                                                email: "",
                                                phoneNumber: "",
                                                address: "",
                                            });
                                        }}
                                        disabled={createManagerMutation.isPending}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="flex-1"
                                        disabled={createManagerMutation.isPending}
                                    >
                                        {createManagerMutation.isPending ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                Creating...
                                            </>
                                        ) : (
                                            <>
                                                <UserPlus className="h-4 w-4 mr-2" />
                                                Create Manager
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}

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

export default ManagersManagement;
