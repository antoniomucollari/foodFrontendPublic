import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { restaurantBranchAPI } from "../../services/api";
import EditOpeningHoursModal from "./EditOpeningHoursModal";
import EditBranchModal from "./EditBranchModal";
import SimpleMap from "../common/SimpleMap";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { toast } from "react-toastify";
import {
    MapPin,
    Phone,
    Clock,
    DollarSign,
    Truck,
    Store,
    Power,
    Edit
} from "lucide-react";

const BranchDetails = () => {
    // Fetch branch details
    const { data: branchResponse, isLoading, error } = useQuery({
        queryKey: ["my-branch-details"],
        queryFn: () => restaurantBranchAPI.getMyBranchDetails(),
    });

    const queryClient = useQueryClient();

    // Toggle Status Mutation
    const toggleStatusMutation = useMutation({
        mutationFn: () => restaurantBranchAPI.toggleBranchStatus(),
        onSuccess: () => {
            queryClient.invalidateQueries(["my-branch-details"]);
            // Toast is handled by global api interceptor or we can add specific one if needed
            // currently api.js handles success toasts if message is present
        },
    });

    // Modal State
    const [isOpeningHoursModalOpen, setIsOpeningHoursModalOpen] = useState(false);
    const [isEditBranchModalOpen, setIsEditBranchModalOpen] = useState(false);

    const branch = branchResponse?.data?.data;

    // Loading state
    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center p-6">
                <div className="text-muted-foreground">Loading branch details...</div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="flex h-full items-center justify-center p-6">
                <div className="text-red-500">
                    Error loading branch details: {error.message}
                </div>
            </div>
        );
    }

    if (!branch) {
        return (
            <div className="flex h-full items-center justify-center p-6">
                <div className="text-muted-foreground">No branch details found.</div>
            </div>
        );
    }



    const handleToggleStatus = () => {
        toggleStatusMutation.mutate();
    };



    // Format currency (assuming generic currency or ALL as per context)
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("sq-AL", {
            style: "currency",
            currency: "ALL",
        }).format(amount);
    };

    const handleEditClick = () => {
        setIsEditBranchModalOpen(true);
    };

    return (
        <div className="space-y-6 p-6 w-full">
            <EditOpeningHoursModal
                isOpen={isOpeningHoursModalOpen}
                onClose={() => setIsOpeningHoursModalOpen(false)}
                currentHours={branch.openingHours}
            />
            <EditBranchModal
                isOpen={isEditBranchModalOpen}
                onClose={() => setIsEditBranchModalOpen(false)}
                branchData={branch}
            />

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">My Branch</h1>
                    <p className="text-muted-foreground">View and manage your branch details</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant={branch.closed ? "destructive" : "default"}
                        onClick={handleToggleStatus}
                        className="gap-2"
                        disabled={toggleStatusMutation.isPending}
                    >
                        <Power className="h-4 w-4" />
                        {toggleStatusMutation.isPending ? "Updating..." : (branch.closed ? "Closed" : "Open")}
                    </Button>
                    <Button variant="outline" onClick={handleEditClick} className="gap-2">
                        <Edit className="h-4 w-4" />
                        Edit Details
                    </Button>
                </div>
            </div>

            {/* Images Section */}
            <div className="relative h-64 rounded-xl overflow-hidden bg-muted">
                {branch.coverImageUrl ? (
                    <img
                        src={branch.coverImageUrl}
                        alt="Cover"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <span className="text-muted-foreground">No Cover Image</span>
                    </div>
                )}

                {/* Profile Image Overlay */}
                <div className="absolute -bottom-10 left-6">
                    {branch.profileImageUrl ? (
                        <div className="h-24 w-24 rounded-full border-4 border-background overflow-hidden bg-background shadow-lg">
                            <img
                                src={branch.profileImageUrl}
                                alt="Profile"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    ) : (
                        <div className="h-24 w-24 rounded-full border-4 border-background bg-gray-300 flex items-center justify-center shadow-lg">
                            <Store className="h-10 w-10 text-muted-foreground" />
                        </div>
                    )}
                </div>

                {/* Branch Status Badge */}
                <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase shadow-sm ${!branch.closed
                        ? "bg-green-500 text-white"
                        : "bg-red-500 text-white"
                        }`}>
                        {!branch.closed ? "Active" : "Closed"}
                    </span>
                </div>
            </div>

            <div className="pt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* General Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Store className="h-5 w-5 text-primary" />
                            General Overview
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Address</p>
                            <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                <p className="text-sm">{branch.address}</p>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Phone Number</p>
                            <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <p className="text-sm">{branch.phoneNumber}</p>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Restaurant</p>
                            <p className="text-sm font-semibold">{branch.restaurantName}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Operations */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Truck className="h-5 w-5 text-primary" />
                            Operations
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Min Order</p>
                                <div className="flex items-center gap-2">
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                    <p className="text-sm">{formatCurrency(branch.minOrderAmount)}</p>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Avg Prep Time</p>
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <p className="text-sm">{branch.avgPrepTimeInMinutes} min</p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Delivery Radius</p>
                            <p className="text-sm">{branch.deliveryRadiusInKm} km</p>
                        </div>
                        <div className="space-y-1 col-span-2">
                            <p className="text-sm font-medium text-muted-foreground mb-2">Location</p>
                            {branch.location ? (
                                <div className="h-48 w-full rounded-md overflow-hidden border border-border">
                                    <SimpleMap
                                        center={{ lat: branch.location.latitude, lng: branch.location.longitude }}
                                        zoom={15}
                                    />
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">Location not available</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Opening Hours */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-primary" />
                                Opening Hours
                            </CardTitle>
                            <Button variant="ghost" size="icon" onClick={() => setIsOpeningHoursModalOpen(true)}>
                                <Edit className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {branch.openingHours && branch.openingHours.length > 0 ? (
                                branch.openingHours.map((schedule, index) => (
                                    <div key={index} className="flex justify-between items-center text-sm border-b border-border pb-1 last:border-0 last:pb-0">
                                        <span className="font-medium text-muted-foreground capitalize">{schedule.dayOfWeek.toLowerCase()}</span>
                                        <span>{schedule.openTime} - {schedule.closeTime}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground">No opening hours defined</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div >
    );
};

export default BranchDetails;
