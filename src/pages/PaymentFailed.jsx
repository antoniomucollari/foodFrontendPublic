import React from "react";
import { useNavigate } from "react-router-dom";
import { XCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";

const PaymentFailed = () => {
    const navigate = useNavigate();

    const handleRetry = () => {
        // Go back to the previous page (likely checkout)
        navigate(-1);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
            <Card className="max-w-md w-full shadow-2xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardContent className="pt-12 pb-8 px-8">
                    <div className="text-center space-y-6">
                        {/* Error Icon */}
                        <div className="flex justify-center">
                            <div className="relative">
                                <div className="absolute inset-0 bg-red-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
                                <div className="relative bg-gradient-to-br from-red-400 to-rose-500 rounded-full p-6 shadow-lg">
                                    <XCircle className="h-16 w-16 text-white" strokeWidth={2.5} />
                                </div>
                            </div>
                        </div>

                        {/* Error Message */}
                        <div className="space-y-3">
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-rose-600 dark:from-red-400 dark:to-rose-400 bg-clip-text text-transparent">
                                Payment Failed
                            </h1>
                            <p className="text-muted-foreground text-lg">
                                We couldn't process your payment.
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Your order has not been placed. Please try again or use a different payment method.
                            </p>
                        </div>

                        {/* Common Reasons */}
                        <div className="bg-muted/50 rounded-lg p-4 text-left">
                            <p className="text-sm font-semibold mb-2">Common reasons for payment failure:</p>
                            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                                <li>Insufficient funds</li>
                                <li>Incorrect card details</li>
                                <li>Card expired or blocked</li>
                                <li>Network connection issues</li>
                            </ul>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-3 pt-4">
                            <Button
                                onClick={handleRetry}
                                className="w-full bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                                size="lg"
                            >
                                <RefreshCw className="mr-2 h-5 w-5" />
                                Try Again
                            </Button>
                            <Button
                                onClick={() => navigate("/")}
                                variant="outline"
                                className="w-full"
                                size="lg"
                            >
                                <ArrowLeft className="mr-2 h-5 w-5" />
                                Back to Home
                            </Button>
                        </div>

                        {/* Support Notice */}
                        <p className="text-xs text-muted-foreground pt-4">
                            Need help? Contact our support team for assistance.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default PaymentFailed;
