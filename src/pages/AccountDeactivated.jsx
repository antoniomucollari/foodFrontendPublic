import React from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useNavigate } from "react-router-dom";

const AccountDeactivated = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md p-8 shadow-lg bg-white text-center">
                <div className="flex justify-center mb-6">
                    <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-8 w-8 text-red-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                        </svg>
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Account Deactivated
                </h1>

                <p className="text-gray-600 mb-6">
                    Your account has been deactivated. Please contact support for more information or assistance.
                </p>

                <Button
                    variant="outline"
                    onClick={() => navigate("/login")}
                    className="w-full"
                >
                    Back to Login
                </Button>
            </Card>
        </div>
    );
};

export default AccountDeactivated;
