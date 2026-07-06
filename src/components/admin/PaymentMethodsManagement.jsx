
import React, { useState, useEffect } from "react";
import { paymentAPI } from "../../services/api";
import { Button } from "../ui/button";
import { Edit, Loader2, Save, X } from "lucide-react";
import { toast } from "react-toastify";

const PaymentMethodsManagement = () => {
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingMethod, setEditingMethod] = useState(null);
    const [newName, setNewName] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchPaymentMethods();
    }, []);

    const fetchPaymentMethods = async () => {
        try {
            const response = await paymentAPI.getAllPaymentMethods();
            setPaymentMethods(response.data.data || []);
        } catch (error) {
            console.error("Failed to fetch payment methods:", error);
            // Toast is handled by interceptor
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (method) => {
        setEditingMethod(method);
        setNewName(method.name);
    };

    const handleCancelEdit = () => {
        setEditingMethod(null);
        setNewName("");
    };

    const handleSave = async () => {
        if (!newName.trim()) {
            toast.error("Name cannot be empty");
            return;
        }

        setSaving(true);
        try {
            await paymentAPI.updatePaymentMethod(editingMethod.id, newName);
            // Update local state
            setPaymentMethods((prev) =>
                prev.map((m) =>
                    m.id === editingMethod.id ? { ...m, name: newName } : m
                )
            );
            setEditingMethod(null);
            setNewName("");
            // Success toast matches API interceptor behavior or backend response
        } catch (error) {
            // Error toast handled by interceptor
            console.error("Failed to update payment method:", error);
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
                <h1 className="text-3xl font-bold tracking-tight">Payment Methods</h1>
            </div>

            <div className="rounded-md border bg-card">
                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm">
                        <thead className="[&_tr]:border-b">
                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[100px]">
                                    ID
                                </th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                    Name
                                </th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                    Payment Method
                                </th>
                                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground w-[100px]">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {paymentMethods.map((method) => (
                                <tr
                                    key={method.id}
                                    className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                                >
                                    <td className="p-4 align-middle font-medium">{method.id}</td>
                                    <td className="p-4 align-middle">
                                        {editingMethod?.id === method.id ? (
                                            <input
                                                type="text"
                                                value={newName}
                                                onChange={(e) => setNewName(e.target.value)}
                                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                                autoFocus
                                            />
                                        ) : (
                                            method.name
                                        )}
                                    </td>
                                    <td className="p-4 align-middle">{method.paymentMethod}</td>
                                    <td className="p-4 align-middle text-right">
                                        {editingMethod?.id === method.id ? (
                                            <div className="flex justify-end space-x-2">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={handleSave}
                                                    disabled={saving}
                                                >
                                                    {saving ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Save className="h-4 w-4 text-green-500" />
                                                    )}
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={handleCancelEdit}
                                                    disabled={saving}
                                                >
                                                    <X className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => handleEditClick(method)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PaymentMethodsManagement;
