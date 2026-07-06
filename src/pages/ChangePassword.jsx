import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { userAPI } from "../services/api";
import { toast } from "react-toastify";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";

const ChangePassword = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        newPassword: "",
        confirmNewPassword: "",
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const validatePassword = (password) => {
        // Min 8 chars, 1 uppercase, 1 lowercase, 1 number
        const regex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).*$/;
        return password.length >= 8 && regex.test(password);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.newPassword !== formData.confirmNewPassword) {
            toast.error("Passwords do not match");
            return;
        }

        if (!validatePassword(formData.newPassword)) {
            toast.error(
                "Password must be at least 8 characters and contain uppercase, lowercase, and a number"
            );
            return;
        }

        setLoading(true);
        try {
            await userAPI.changePassword({
                oldPassword: "", // Not required for forced change
                newPassword: formData.newPassword,
                confirmNewPassword: formData.confirmNewPassword,
            });
            toast.success("Password changed successfully. Please login with your new password.");

            // Clear session and redirect to login
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            navigate("/login");
        } catch (error) {
            console.error("Failed to change password:", error);
            // Error is handled by global handler, but if it fails validation we might see it here
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md p-6 shadow-lg bg-white">
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Change Password</h1>
                    <p className="text-gray-600 mt-2">
                        A password change is required for your account security.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input
                            id="newPassword"
                            name="newPassword"
                            type="password"
                            placeholder="Enter new password"
                            value={formData.newPassword}
                            onChange={handleChange}
                            required
                            disabled={loading}
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                        <Input
                            id="confirmNewPassword"
                            name="confirmNewPassword"
                            type="password"
                            placeholder="Confirm new password"
                            value={formData.confirmNewPassword}
                            onChange={handleChange}
                            required
                            disabled={loading}
                            className="w-full"
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white"
                        disabled={loading}
                    >
                        {loading ? "Changing Password..." : "Change Password"}
                    </Button>
                </form>
            </Card>
        </div>
    );
};

export default ChangePassword;
