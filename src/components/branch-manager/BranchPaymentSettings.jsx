
import React, { useState, useEffect } from "react";
import { paymentAPI, branchManagerAPI } from "../../services/api";
import { Button } from "../ui/button";
import { Loader2, Save } from "lucide-react";
import { toast } from "react-toastify";
import { Switch } from "../ui/switch";

const BranchPaymentSettings = () => {
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const response = await paymentAPI.getBranchPaymentMethods();
            // Expecting response structure like { data: [ ... ] } based on user provided example
            // or wrapped response { data: { data: [ ... ] } } if similar to previous issue
            // User showed:
            // {
            //     "statusCode": 200,
            //     "message": "Branch payment configuration loaded.",
            //     "data": [ ... ]
            // }
            // So response.data.data should be the array
            setPaymentMethods(response.data.data || []);
        } catch (error) {
            console.error("Failed to fetch payment settings:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = (id) => {
        setPaymentMethods((prev) =>
            prev.map((method) =>
                method.id === id ? { ...method, enabled: !method.enabled } : method
            )
        );
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Filter enabled methods and extract IDs
            const enabledIds = paymentMethods
                .filter((method) => method.enabled)
                .map((method) => method.id);

            await branchManagerAPI.updateBranchPaymentMethods(enabledIds);
            toast.success("Payment settings updated successfully");
        } catch (error) {
            console.error("Failed to update payment settings:", error);
            // Toast handled by interceptor if configured, otherwise we might see duplicate or none
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Payment Settings</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage accepted payment methods for this branch.
                    </p>
                </div>
                <Button onClick={handleSave} disabled={saving}>
                    {saving ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Save className="mr-2 h-4 w-4" />
                    )}
                    Save Changes
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {paymentMethods.map((method) => (
                    <div
                        key={method.id}
                        className="flex items-center justify-between p-4 rounded-lg border bg-card shadow-sm"
                    >
                        <div className="space-y-0.5">
                            <div className="font-semibold">{method.name}</div>
                            <div className="text-xs text-muted-foreground">
                                {method.paymentMethod}
                            </div>
                        </div>
                        <Switch
                            checked={method.enabled}
                            onCheckedChange={() => handleToggle(method.id)}
                        />
                    </div>
                ))}

                {paymentMethods.length === 0 && (
                    <div className="col-span-full text-center py-8 text-muted-foreground">
                        No payment methods available.
                    </div>
                )}
            </div>
        </div>
    );
};

export default BranchPaymentSettings;
