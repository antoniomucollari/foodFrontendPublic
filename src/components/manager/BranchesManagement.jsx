import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { managerRestaurantAPI, restaurantBranchAPI } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "../ui/dialog";
import { Loader2, Store, MapPin, Clock, DollarSign, Star, Trash2, Pencil, Eye, XCircle, CheckCircle, Phone, Navigation, UserX, UserCog, Search, User, Check, RotateCcw, Plus, Filter } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select";
import { Checkbox } from "../ui/checkbox";

const BranchesManagement = () => {
    const { user } = useAuth();

    const [selectedBranchId, setSelectedBranchId] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingBranch, setEditingBranch] = useState(null);
    const [editForm, setEditForm] = useState({
        address: "",
        phoneNumber: "",
        delivery_radius_in_km: "",
        latitude: "",
        longitude: ""
    });

    // Create Modal State
    // Create Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createForm, setCreateForm] = useState({
        address: "",
        phoneNumber: "",
        delivery_radius_in_km: "",
        latitude: "",
        longitude: ""
    });

    // Change Manager Modal State
    const [isChangeManagerModalOpen, setIsChangeManagerModalOpen] = useState(false);
    const [branchToChangeManager, setBranchToChangeManager] = useState(null);
    const [managerSearchTerm, setManagerSearchTerm] = useState("");
    const [selectedManagerId, setSelectedManagerId] = useState(null);
    const [showAssigned, setShowAssigned] = useState(false);

    // Filters State
    const [filters, setFilters] = useState({
        includeDeleted: false,
        hasManager: "all" // "all", "true", "false"
    });

    // Delete Branch Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [branchToDelete, setBranchToDelete] = useState(null);

    // Restore Branch Modal State
    const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
    const [branchToRestore, setBranchToRestore] = useState(null);

    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markerRef = useRef(null);

    // Edit Map Refs
    const editMapRef = useRef(null);
    const editMapInstanceRef = useRef(null);
    const editMarkerRef = useRef(null);

    // Create Map Refs
    const createMapRef = useRef(null);
    const createMapInstanceRef = useRef(null);
    const createMarkerRef = useRef(null);

    const queryClient = useQueryClient();

    // Fetch All Branches
    const { data: branchesData, isLoading } = useQuery({
        queryKey: ["manager-branches", filters],
        queryFn: () => managerRestaurantAPI.getManagerBranches(filters),
    });

    // Fetch Single Branch Details (for View)
    const { data: branchDetailsData, isLoading: isDetailsLoading } = useQuery({
        queryKey: ["branch-details", selectedBranchId],
        queryFn: () => restaurantBranchAPI.getBranchDetails(selectedBranchId),
        enabled: !!selectedBranchId && isViewModalOpen,
    });

    // Fetch Potential Managers (only when modal is open)
    const { data: managersData, isLoading: isManagersLoading } = useQuery({
        queryKey: ["branch-managers", managerSearchTerm, showAssigned],
        queryFn: () => managerRestaurantAPI.getBranchManagers({ name: managerSearchTerm, isAssigned: showAssigned }),
        enabled: isChangeManagerModalOpen,
        keepPreviousData: true
    });

    const potentialManagers = managersData?.data?.data || [];

    // Update Branch Mutation
    const updateBranchMutation = useMutation({
        mutationFn: (data) => restaurantBranchAPI.updateBranch(editingBranch.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(["manager-branches"]);
            setIsEditModalOpen(false);
            setEditingBranch(null);
        },
        onError: (error) => {
            console.error("Failed to update branch:", error);
        }
    });

    // Change Branch Manager Mutation
    const changeManagerMutation = useMutation({
        mutationFn: ({ branchId, userId }) => managerRestaurantAPI.changeBranchManager(branchId, userId),
        onSuccess: () => {
            queryClient.invalidateQueries(["manager-branches"]);
            setIsChangeManagerModalOpen(false);
            setBranchToChangeManager(null);
            setSelectedManagerId(null);
            setManagerSearchTerm("");
        },
        onError: (error) => {
            console.error("Failed to change manager:", error);
        }
    });

    // Delete Branch Mutation
    const deleteBranchMutation = useMutation({
        mutationFn: (branchId) => managerRestaurantAPI.deleteBranch(branchId),
        onSuccess: () => {
            queryClient.invalidateQueries(["manager-branches"]);
            setIsDeleteModalOpen(false);
            setBranchToDelete(null);
        },
        onError: (error) => {
            console.error("Failed to delete branch:", error);
        }
    });

    // Restore Branch Mutation
    const restoreBranchMutation = useMutation({
        mutationFn: (branchId) => managerRestaurantAPI.restoreBranch(branchId),
        onSuccess: () => {
            queryClient.invalidateQueries(["manager-branches"]);
            setIsRestoreModalOpen(false);
            setBranchToRestore(null);
        },
        onError: (error) => {
            console.error("Failed to restore branch:", error);
        }
    });

    // Create Branch Mutation
    const createBranchMutation = useMutation({
        mutationFn: (data) => restaurantBranchAPI.createBranch(data),
        onSuccess: () => {
            queryClient.invalidateQueries(["manager-branches"]);
            setIsCreateModalOpen(false);
            setCreateForm({
                address: "",
                phoneNumber: "",
                delivery_radius_in_km: "",
                latitude: "",
                longitude: ""
            });
        },
        onError: (error) => {
            console.error("Failed to create branch:", error);
        }
    });

    const branches = branchesData?.data?.data || [];
    const branchDetails = branchDetailsData?.data?.data;

    // Initialize Google Map for VIEW Modal
    useEffect(() => {
        if (!isViewModalOpen || !branchDetails || !branchDetails.location) return;
        if (!window.google || !window.google.maps) return;

        const location = {
            lat: branchDetails.location.latitude,
            lng: branchDetails.location.longitude
        };

        // Use a longer delay to ensure the dialog DOM + ref are fully ready
        const timer = setTimeout(() => {
            if (!mapRef.current) return;

            if (!mapInstanceRef.current) {
                mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
                    center: location,
                    zoom: 15,
                    mapTypeControl: false,
                    streetViewControl: false,
                });
                markerRef.current = new window.google.maps.Marker({
                    position: location,
                    map: mapInstanceRef.current,
                    title: branchDetails.address || "Branch Location"
                });
            } else {
                mapInstanceRef.current.setCenter(location);
                if (markerRef.current) {
                    markerRef.current.setPosition(location);
                } else {
                    markerRef.current = new window.google.maps.Marker({
                        position: location,
                        map: mapInstanceRef.current,
                        title: branchDetails.address || "Branch Location"
                    });
                }
            }
        }, 200);

        return () => clearTimeout(timer);
    }, [isViewModalOpen, branchDetails]);

    // Initialize Google Map for EDIT Modal
    useEffect(() => {
        if (isEditModalOpen && window.google && window.google.maps) {
            const timer = setTimeout(() => {
                if (editMapRef.current) {
                    const lat = parseFloat(editForm.latitude);
                    const lng = parseFloat(editForm.longitude);
                    const hasValidLocation = !isNaN(lat) && !isNaN(lng);

                    const location = hasValidLocation
                        ? { lat, lng }
                        : { lat: 41.3275, lng: 19.8187 };

                    if (!editMapInstanceRef.current) {
                        editMapInstanceRef.current = new window.google.maps.Map(editMapRef.current, {
                            center: location,
                            zoom: 15,
                            mapTypeControl: false,
                            streetViewControl: false,
                        });

                        editMarkerRef.current = new window.google.maps.Marker({
                            position: location,
                            map: editMapInstanceRef.current,
                            draggable: true,
                            title: "Drag to set location"
                        });

                        editMarkerRef.current.addListener("dragend", (event) => {
                            const newLat = event.latLng.lat();
                            const newLng = event.latLng.lng();
                            setEditForm(prev => ({
                                ...prev,
                                latitude: newLat,
                                longitude: newLng
                            }));
                        });
                    } else {
                        editMapInstanceRef.current.setCenter(location);
                        if (editMarkerRef.current) {
                            editMarkerRef.current.setPosition(location);
                        } else {
                            editMarkerRef.current = new window.google.maps.Marker({
                                position: location,
                                map: editMapInstanceRef.current,
                                draggable: true,
                                title: "Drag to set location"
                            });
                            editMarkerRef.current.addListener("dragend", (event) => {
                                const newLat = event.latLng.lat();
                                const newLng = event.latLng.lng();
                                setEditForm(prev => ({
                                    ...prev,
                                    latitude: newLat,
                                    longitude: newLng
                                }));
                            });
                        }
                    }
                }
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [isEditModalOpen]);

    // Update Marker when Inputs Change
    useEffect(() => {
        if (isEditModalOpen && editMapInstanceRef.current && editMarkerRef.current) {
            const lat = parseFloat(editForm.latitude);
            const lng = parseFloat(editForm.longitude);
            if (!isNaN(lat) && !isNaN(lng)) {
                const newPos = { lat, lng };
                const currentPos = editMarkerRef.current.getPosition();
                if (Math.abs(currentPos.lat() - lat) > 0.000001 || Math.abs(currentPos.lng() - lng) > 0.000001) {
                    editMarkerRef.current.setPosition(newPos);
                    editMapInstanceRef.current.panTo(newPos);
                }
            }
        }
    }, [editForm.latitude, editForm.longitude, isEditModalOpen]);

    // Initialize Google Map for CREATE Modal
    useEffect(() => {
        if (isCreateModalOpen && window.google && window.google.maps) {
            const timer = setTimeout(() => {
                if (createMapRef.current) {
                    const lat = parseFloat(createForm.latitude) || 41.3275;
                    const lng = parseFloat(createForm.longitude) || 19.8187; // Default to Tirana

                    const location = { lat, lng };

                    if (!createMapInstanceRef.current) {
                        createMapInstanceRef.current = new window.google.maps.Map(createMapRef.current, {
                            center: location,
                            zoom: 13,
                            mapTypeControl: false,
                            streetViewControl: false,
                        });

                        createMarkerRef.current = new window.google.maps.Marker({
                            position: location,
                            map: createMapInstanceRef.current,
                            draggable: true,
                            title: "Drag to set location"
                        });

                        createMarkerRef.current.addListener("dragend", (event) => {
                            const newLat = event.latLng.lat();
                            const newLng = event.latLng.lng();
                            setCreateForm(prev => ({
                                ...prev,
                                latitude: newLat,
                                longitude: newLng
                            }));
                        });

                        // Click to place marker if not set correctly
                        createMapInstanceRef.current.addListener("click", (event) => {
                            const newLat = event.latLng.lat();
                            const newLng = event.latLng.lng();
                            createMarkerRef.current.setPosition({ lat: newLat, lng: newLng });
                            setCreateForm(prev => ({
                                ...prev,
                                latitude: newLat,
                                longitude: newLng
                            }));
                        });
                    } else {
                        createMapInstanceRef.current.setCenter(location);
                        if (createMarkerRef.current) {
                            createMarkerRef.current.setPosition(location);
                        } else {
                            // Re-init marker if needed
                            createMarkerRef.current = new window.google.maps.Marker({
                                position: location,
                                map: createMapInstanceRef.current,
                                draggable: true,
                            });
                            createMarkerRef.current.addListener("dragend", (event) => {
                                const newLat = event.latLng.lat();
                                const newLng = event.latLng.lng();
                                setCreateForm(prev => ({
                                    ...prev,
                                    latitude: newLat,
                                    longitude: newLng
                                }));
                            });
                        }
                    }
                }
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [isCreateModalOpen]);


    // Cleanup Maps on modal close
    useEffect(() => {
        if (!isViewModalOpen) {
            // Destroy marker and map instance so they re-initialize correctly on next open
            if (markerRef.current) {
                markerRef.current.setMap(null);
                markerRef.current = null;
            }
            mapInstanceRef.current = null;
        }
    }, [isViewModalOpen]);

    useEffect(() => {
        if (!isEditModalOpen) {
            editMapInstanceRef.current = null;
            editMarkerRef.current = null;
        }
    }, [isEditModalOpen]);

    useEffect(() => {
        if (!isCreateModalOpen) {
            createMapInstanceRef.current = null;
            createMarkerRef.current = null;
        }
    }, [isCreateModalOpen]);

    const handleViewBranch = (branchId) => {
        setSelectedBranchId(branchId);
        setIsViewModalOpen(true);
    };

    const closeViewModal = () => {
        setIsViewModalOpen(false);
        setSelectedBranchId(null);
    };

    const handleEditClick = (branch) => {
        setEditingBranch(branch);
        setEditForm({
            address: branch.address || "",
            delivery_radius_in_km: branch.deliveryRadiusInKm || "",
            latitude: branch.location?.latitude || "",
            longitude: branch.location?.longitude || ""
        });
        setIsEditModalOpen(true);
    };

    const handleChangeManagerClick = (branch) => {
        setBranchToChangeManager(branch);
        setManagerSearchTerm("");
        setSelectedManagerId(null);
        setShowAssigned(false);
        setIsChangeManagerModalOpen(true);
    }

    const handleEditFormChange = (e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleCreateFormChange = (e) => {
        const { name, value } = e.target;
        setCreateForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleCreateBranch = (e) => {
        e.preventDefault();
        const payload = {
            address: createForm.address,
            phoneNumber: createForm.phoneNumber,
            delivery_radius_in_km: parseFloat(createForm.delivery_radius_in_km),
            latitude: parseFloat(createForm.latitude),
            longitude: parseFloat(createForm.longitude),
            isActive: true
        };
        createBranchMutation.mutate(payload);
    };

    const handleUpdateBranch = (e) => {
        e.preventDefault();
        const payload = {
            address: editForm.address,
            delivery_radius_in_km: parseFloat(editForm.delivery_radius_in_km),
            latitude: parseFloat(editForm.latitude),
            longitude: parseFloat(editForm.longitude)
        };
        updateBranchMutation.mutate(payload);
    };

    const handleSubmitChangeManager = () => {
        if (branchToChangeManager && selectedManagerId) {
            changeManagerMutation.mutate({
                branchId: branchToChangeManager.id,
                userId: selectedManagerId
            });
        }
    };

    const handleRemoveManager = () => {
        if (branchToChangeManager) {
            changeManagerMutation.mutate({
                branchId: branchToChangeManager.id,
                userId: null
            });
        }
    };

    const handleDeleteClick = (branch) => {
        setBranchToDelete(branch);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = () => {
        if (branchToDelete) {
            deleteBranchMutation.mutate(branchToDelete.id);
        }
    };

    const handleRestoreClick = (branch) => {
        setBranchToRestore(branch);
        setIsRestoreModalOpen(true);
    };

    const handleConfirmRestore = () => {
        if (branchToRestore) {
            restoreBranchMutation.mutate(branchToRestore.id);
        }
    };


    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="animate-spin h-8 w-8 text-primary" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Branches</h1>
                    <p className="text-muted-foreground">Manage your restaurant branches</p>
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Branch
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4 bg-muted/20 p-4 rounded-lg border">
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Filters:</span>
                </div>

                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="includeDeleted"
                        checked={filters.includeDeleted}
                        onCheckedChange={(checked) => setFilters(prev => ({ ...prev, includeDeleted: checked }))}
                    />
                    <label
                        htmlFor="includeDeleted"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                        Show Deleted
                    </label>
                </div>

                <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">Manager Status:</span>
                    <Select
                        value={filters.hasManager}
                        onValueChange={(value) => setFilters(prev => ({ ...prev, hasManager: value }))}
                    >
                        <SelectTrigger className="w-[180px] h-8">
                            <SelectValue placeholder="Filter by Manager" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Branches</SelectItem>
                            <SelectItem value="true">Assigned Only</SelectItem>
                            <SelectItem value="false">Unassigned Only</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {branches.length === 0 ? (
                    <div className="col-span-full text-center py-10 text-muted-foreground">
                        No branches found.
                    </div>
                ) : (
                    branches.map((branch) => {
                        let cardClassName = "overflow-hidden hover:shadow-md transition-shadow relative";

                        if (branch.deleted) {
                            cardClassName += " opacity-60 grayscale bg-muted border-destructive/20";
                        } else if (!branch.managerName) {
                            cardClassName += " border-amber-400 bg-amber-50/50 dark:bg-amber-950/10";
                        }

                        return (
                            <Card key={branch.id} className={cardClassName}>
                                {branch.deleted && (
                                    <div className="absolute inset-0 z-10 bg-background/10 pointer-events-none" />
                                )}
                                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 bg-muted/20">
                                    <div className="space-y-1">
                                        <CardTitle className="text-lg font-medium flex items-center gap-2">
                                            <Store className="h-5 w-5 text-primary" />
                                            Branch #{branch.id}
                                        </CardTitle>
                                        <div className="flex flex-col gap-1 text-sm">
                                            <div className="flex items-center text-muted-foreground">
                                                {branch.deleted ? (
                                                    <span className="flex items-center text-destructive font-medium">
                                                        <XCircle className="h-3 w-3 mr-1" /> Deleted
                                                    </span>
                                                ) : branch.closed ? (
                                                    <span className="flex items-center text-amber-500 font-medium">
                                                        <XCircle className="h-3 w-3 mr-1" /> Closed
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center text-green-600 font-medium">
                                                        <CheckCircle className="h-3 w-3 mr-1" /> Open
                                                    </span>
                                                )}
                                            </div>

                                            {!branch.deleted && (
                                                <div className="text-xs">
                                                    {branch.managerName ? (
                                                        <span className="text-muted-foreground">
                                                            Manager: <span className="font-medium text-foreground">{branch.managerName}</span>
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center text-amber-600 dark:text-amber-400 font-medium">
                                                            <UserX className="h-3 w-3 mr-1" /> No Manager Assigned
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-1 z-20">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                                            title="View Details"
                                            onClick={() => handleViewBranch(branch.id)}
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-blue-600"
                                            title="Change Manager"
                                            onClick={() => handleChangeManagerClick(branch)}
                                        >
                                            <UserCog className="h-4 w-4" />
                                        </Button>
                                        {/* Edit Button commented out as per request, but accessible inside view modal */}
                                        {branch.deleted ? (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-green-600"
                                                title="Restore Branch"
                                                onClick={() => handleRestoreClick(branch)}
                                            >
                                                <RotateCcw className="h-4 w-4" />
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                title="Delete"
                                                onClick={() => handleDeleteClick(branch)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-4 space-y-3">
                                    <div className="flex items-start gap-2 text-sm">
                                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                        <span className="line-clamp-2">{branch.address}</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-sm pt-2">
                                        <div className="flex items-center gap-2 text-muted-foreground" title="Average Rating">
                                            <Star className="h-4 w-4 text-amber-400" />
                                            <span>{branch.averageRating > 0 ? branch.averageRating.toFixed(1) : "N/A"}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-muted-foreground" title="Min Order Amount">
                                            <DollarSign className="h-4 w-4" />
                                            <span>{branch.minOrderAmount}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-muted-foreground col-span-2" title="Avg Prep Time">
                                            <Clock className="h-4 w-4" />
                                            <span>~{branch.avgPrepTimeInMinutes} mins prep</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>

            {/* View Branch Modal */}
            <Dialog open={isViewModalOpen} onOpenChange={closeViewModal}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="flex flex-row items-center justify-between pr-8">
                        <div>
                            <DialogTitle>Branch Details</DialogTitle>
                            {branchDetails && (
                                <DialogDescription>
                                    {branchDetails.active ? "Active Branch" : "Inactive Branch"}
                                </DialogDescription>
                            )}
                        </div>
                        {branchDetails && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2"
                                onClick={() => handleEditClick(branchDetails)}
                            >
                                <Pencil className="h-4 w-4" />
                                Edit Branch
                            </Button>
                        )}
                    </DialogHeader>

                    {isDetailsLoading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="animate-spin h-10 w-10 text-primary" />
                        </div>
                    ) : branchDetails ? (
                        <div className="space-y-6">
                            {/* Content ... (Same as before) */}
                            <div className="relative h-48 w-full rounded-lg overflow-hidden bg-muted">
                                <img
                                    src={branchDetails.coverImageUrl || "https://placehold.co/800x200?text=No+Cover+Image"}
                                    alt="Cover"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute -bottom-10 left-6">
                                    <div className="h-24 w-24 rounded-full border-4 border-background overflow-hidden bg-white shadow-md">
                                        <img
                                            src={branchDetails.profileImageUrl || "https://placehold.co/100x100?text=Logo"}
                                            alt="Profile"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="mt-12 space-y-1 px-1">
                                <h2 className="text-2xl font-bold">{branchDetails.restaurantName} - Branch #{branchDetails.id}</h2>
                                <div className="flex items-center text-muted-foreground gap-2">
                                    <MapPin className="h-4 w-4" />
                                    <span>{branchDetails.address}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-6">
                                    <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                                        <h3 className="font-semibold flex items-center gap-2">
                                            <Store className="h-4 w-4" />
                                            Branch Info
                                        </h3>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Status:</span>
                                                <span className={branchDetails.closed ? "text-destructive font-medium" : "text-green-600 font-medium"}>
                                                    {branchDetails.closed ? "Closed" : "Open"}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" /> Phone:</span>
                                                <span>{branchDetails.phoneNumber}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground flex items-center gap-1"><Navigation className="h-3 w-3" /> Radius:</span>
                                                <span>{branchDetails.deliveryRadiusInKm} km</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="rounded-lg overflow-hidden border h-64 w-full">
                                        {branchDetails.location ? (
                                            <div ref={mapRef} className="w-full h-full" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-muted/30 text-muted-foreground">
                                                Map Data Not Available
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                                        <h3 className="font-semibold flex items-center gap-2">
                                            <Clock className="h-4 w-4" />
                                            Opening Hours
                                        </h3>
                                        <div className="space-y-1 text-sm">
                                            {branchDetails.openingHours && branchDetails.openingHours.map((schedule, index) => (
                                                <div key={index} className="flex justify-between py-1 border-b border-border/50 last:border-0">
                                                    <span className="font-medium capitalize text-muted-foreground">{schedule.dayOfWeek.toLowerCase()}</span>
                                                    <span>{schedule.openTime.slice(0, 5)} - {schedule.closeTime.slice(0, 5)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-10 text-muted-foreground">
                            Failed to load branch details.
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Edit Branch Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Branch</DialogTitle>
                        <DialogDescription>
                            Update branch details. Drag marker on map to exact location.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdateBranch} className="space-y-4">
                        <div className="rounded-lg overflow-hidden border h-64 w-full relative">
                            <div ref={editMapRef} className="w-full h-full" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 col-span-2">
                                <Label htmlFor="address">Address</Label>
                                <Input
                                    id="address"
                                    name="address"
                                    value={editForm.address}
                                    onChange={handleEditFormChange}
                                    required
                                    className="bg-muted/50"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="delivery_radius_in_km">Delivery Radius (km)</Label>
                                <Input
                                    id="delivery_radius_in_km"
                                    name="delivery_radius_in_km"
                                    type="number"
                                    step="0.1"
                                    value={editForm.delivery_radius_in_km}
                                    onChange={handleEditFormChange}
                                    required
                                    className="bg-muted/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="latitude">Latitude</Label>
                                <Input
                                    id="latitude"
                                    name="latitude"
                                    type="number"
                                    step="any"
                                    value={editForm.latitude}
                                    onChange={handleEditFormChange}
                                    required
                                    className="bg-muted/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="longitude">Longitude</Label>
                                <Input
                                    id="longitude"
                                    name="longitude"
                                    type="number"
                                    step="any"
                                    value={editForm.longitude}
                                    onChange={handleEditFormChange}
                                    required
                                    className="bg-muted/50"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={updateBranchMutation.isPending}>
                                {updateBranchMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Change Manager Modal */}
            <Dialog open={isChangeManagerModalOpen} onOpenChange={setIsChangeManagerModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Assign Branch Manager</DialogTitle>
                        <DialogDescription>
                            Select a new manager for Branch #{branchToChangeManager?.id}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        {/* Assigned / Not Assigned Toggle */}
                        <div className="flex items-center gap-2 p-1 bg-muted rounded-lg">
                            <button
                                type="button"
                                className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${!showAssigned
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                                    }`}
                                onClick={() => {
                                    setShowAssigned(false);
                                    setSelectedManagerId(null);
                                }}
                            >
                                Not Assigned
                            </button>
                            <button
                                type="button"
                                className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${showAssigned
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                                    }`}
                                onClick={() => {
                                    setShowAssigned(true);
                                    setSelectedManagerId(null);
                                }}
                            >
                                Assigned
                            </button>
                        </div>

                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or email..."
                                className="pl-9"
                                value={managerSearchTerm}
                                onChange={(e) => setManagerSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="border rounded-md h-64 overflow-y-auto">
                            {isManagersLoading ? (
                                <div className="flex h-full items-center justify-center">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                </div>
                            ) : potentialManagers.length === 0 ? (
                                <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                                    {showAssigned ? "No assigned managers found" : "No available managers found"}
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {potentialManagers.map((manager) => {
                                        const isCurrentBranchManager = manager.id === branchToChangeManager?.managerId;

                                        return (
                                            <div
                                                key={manager.id}
                                                className={`p-3 flex items-start gap-3 transition-colors ${showAssigned && isCurrentBranchManager
                                                    ? "bg-primary/5 border-l-2 border-l-primary"
                                                    : selectedManagerId === manager.id
                                                        ? "bg-primary/5 hover:bg-primary/10 cursor-pointer"
                                                        : showAssigned
                                                            ? "opacity-60"
                                                            : "hover:bg-muted/50 cursor-pointer"
                                                    }`}
                                                onClick={() => {
                                                    if (!showAssigned) {
                                                        setSelectedManagerId(manager.id);
                                                    } else if (isCurrentBranchManager) {
                                                        setSelectedManagerId(manager.id);
                                                    }
                                                }}
                                            >
                                                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                                                    <User className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <p className="font-medium text-sm truncate">{manager.name}</p>
                                                        {!showAssigned && selectedManagerId === manager.id && (
                                                            <Check className="h-4 w-4 text-primary shrink-0" />
                                                        )}
                                                        {showAssigned && isCurrentBranchManager && (
                                                            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full shrink-0">
                                                                Current
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground truncate">{manager.email}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <p className="text-xs text-muted-foreground">ID: {manager.id}</p>
                                                        {showAssigned && !isCurrentBranchManager && manager.restaurantBranchId && (
                                                            <span className="text-xs text-muted-foreground">
                                                                · Branch #{manager.restaurantBranchId}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="flex-col sm:flex-row gap-2 sm:justify-between items-center">
                        {showAssigned ? (
                            <>
                                <div className="w-full sm:w-auto flex justify-start">
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        onClick={handleRemoveManager}
                                        disabled={changeManagerMutation.isPending || !branchToChangeManager?.managerId}
                                        className="w-full sm:w-auto"
                                    >
                                        {changeManagerMutation.isPending && !selectedManagerId ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <UserX className="mr-2 h-4 w-4" />
                                        )}
                                        Unassign Manager
                                    </Button>
                                </div>
                                <Button variant="outline" onClick={() => setIsChangeManagerModalOpen(false)}>Cancel</Button>
                            </>
                        ) : (
                            <div className="flex gap-2 w-full sm:w-auto justify-end ml-auto">
                                <Button variant="outline" onClick={() => setIsChangeManagerModalOpen(false)}>Cancel</Button>
                                <Button
                                    onClick={handleSubmitChangeManager}
                                    disabled={!selectedManagerId || changeManagerMutation.isPending}
                                >
                                    {changeManagerMutation.isPending && selectedManagerId && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Assign Manager
                                </Button>
                            </div>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>


            {/* Delete Branch Confirmation Modal */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Branch</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete Branch #{branchToDelete?.id}? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
                        <Button
                            variant="destructive"
                            onClick={handleConfirmDelete}
                            disabled={deleteBranchMutation.isPending}
                        >
                            {deleteBranchMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete Branch
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Restore Branch Confirmation Modal */}
            <Dialog open={isRestoreModalOpen} onOpenChange={setIsRestoreModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Restore Branch</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to restore Branch #{branchToRestore?.id}? It will be active again.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRestoreModalOpen(false)}>Cancel</Button>
                        <Button
                            onClick={handleConfirmRestore}
                            disabled={restoreBranchMutation.isPending}
                            className="bg-green-600 hover:bg-green-700 text-white"
                        >
                            {restoreBranchMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Restore Branch
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create Branch Modal */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Add New Branch</DialogTitle>
                        <DialogDescription>
                            Enter details for the new branch.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateBranch} className="space-y-4">
                        <div className="rounded-lg overflow-hidden border h-64 w-full relative">
                            <div ref={createMapRef} className="w-full h-full" />
                            {!createForm.latitude && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                                    <p className="bg-background px-3 py-1 rounded shadow text-sm font-medium">
                                        Click map to set location
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 col-span-2">
                                <Label htmlFor="create-address">Address</Label>
                                <Input
                                    id="create-address"
                                    name="address"
                                    value={createForm.address}
                                    onChange={handleCreateFormChange}
                                    required
                                    placeholder="Full address"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="create-phoneNumber">Phone Number</Label>
                                <Input
                                    id="create-phoneNumber"
                                    name="phoneNumber"
                                    value={createForm.phoneNumber}
                                    onChange={handleCreateFormChange}
                                    required
                                    placeholder="+355..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="create-delivery_radius">Delivery Radius (km)</Label>
                                <Input
                                    id="create-delivery_radius"
                                    name="delivery_radius_in_km"
                                    type="number"
                                    step="0.1"
                                    value={createForm.delivery_radius_in_km}
                                    onChange={handleCreateFormChange}
                                    required
                                    placeholder="e.g. 5.0"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="create-latitude">Latitude</Label>
                                <Input
                                    id="create-latitude"
                                    name="latitude"
                                    type="number"
                                    step="any"
                                    value={createForm.latitude}
                                    onChange={handleCreateFormChange}
                                    required
                                    readOnly
                                    className="bg-muted"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="create-longitude">Longitude</Label>
                                <Input
                                    id="create-longitude"
                                    name="longitude"
                                    type="number"
                                    step="any"
                                    value={createForm.longitude}
                                    onChange={handleCreateFormChange}
                                    required
                                    readOnly
                                    className="bg-muted"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={createBranchMutation.isPending}>
                                {createBranchMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Branch
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div >
    );
};

export default BranchesManagement;
