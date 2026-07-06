import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { restaurantBranchAPI } from "../../services/api";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { toast } from "react-toastify";
import { Clock, Save } from "lucide-react";

const DAYS_OF_WEEK = [
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY",
];

const EditOpeningHoursModal = ({ isOpen, onClose, currentHours }) => {
    const queryClient = useQueryClient();
    const [hours, setHours] = useState([]);

    // Initialize state when modal opens or currentHours changes
    useEffect(() => {
        if (isOpen) {
            const initialHours = DAYS_OF_WEEK.map((day) => {
                const existing = currentHours?.find((h) => h.dayOfWeek === day);
                return {
                    dayOfWeek: day,
                    openTime: existing?.openTime?.slice(0, 5) || "09:00", // "HH:mm"
                    closeTime: existing?.closeTime?.slice(0, 5) || "17:00",
                    isOpen: !!existing, // Track if open/closed for that day?? Assuming all days exist based on payload requirement, but let's stick to simple time editing first.
                };
            });
            setHours(initialHours);
        }
    }, [isOpen, currentHours]);

    const updateHoursMutation = useMutation({
        mutationFn: (data) => restaurantBranchAPI.updateOpeningHours(data),
        onSuccess: () => {
            queryClient.invalidateQueries(["my-branch-details"]);
            toast.success("Opening hours updated successfully");
            onClose();
        },
        onError: (error) => {
            console.error("Failed to update opening hours:", error);
            // Error handling is also done globally, but adding specific log here
        },
    });

    const handleTimeChange = (index, field, value) => {
        const newHours = [...hours];
        newHours[index] = { ...newHours[index], [field]: value };
        setHours(newHours);
    };

    const handleSubmit = () => {
        // Prepare payload
        // The API likely expects the full seconds format "HH:mm:ss" or just "HH:mm". 
        // The PROMPT example showed "09:00:00" in GET and "09:00" in POST. To be safe, "HH:mm" usually works or backend handles it.
        // Let's send what the input gives ("HH:mm"). 

        const payload = {
            openingHours: hours.map(h => ({
                dayOfWeek: h.dayOfWeek,
                openTime: h.openTime,
                closeTime: h.closeTime
            }))
        };

        updateHoursMutation.mutate(payload);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Edit Opening Hours
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {hours.map((schedule, index) => (
                        <div key={schedule.dayOfWeek} className="grid grid-cols-3 gap-4 items-center">
                            <div className="font-medium text-sm capitalize">
                                {schedule.dayOfWeek.toLowerCase()}
                            </div>
                            <div className="col-span-2 flex items-center gap-2">
                                <input
                                    type="time"
                                    value={schedule.openTime}
                                    onChange={(e) => handleTimeChange(index, "openTime", e.target.value)}
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                />
                                <span className="text-muted-foreground">-</span>
                                <input
                                    type="time"
                                    value={schedule.closeTime}
                                    onChange={(e) => handleTimeChange(index, "closeTime", e.target.value)}
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={updateHoursMutation.isPending}
                        className="gap-2"
                    >
                        {updateHoursMutation.isPending ? (
                            "Saving..."
                        ) : (
                            <>
                                <Save className="h-4 w-4" />
                                Save Changes
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default EditOpeningHoursModal;
