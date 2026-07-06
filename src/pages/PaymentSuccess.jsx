import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Check, CheckCircle, ArrowRight, XCircle, Loader2, Phone } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { paymentAPI } from "../services/api";
import {useTheme} from "@/contexts/ThemeContext.jsx";

const PaymentSuccess = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const orderId = searchParams.get("orderId");
    const [status, setStatus] = useState("loading"); // "loading", "success", "error"
    const { theme } = useTheme();
    const vector = theme === "dark" ? "/payment_success-dark.png" : "/payment_success-dark.png";
    useEffect(() => {
        if (!orderId) {
            setStatus("error");
            return;
        }

        const verifyPayment = async () => {
            try {
                const response = await paymentAPI.checkPaymentSuccessful(orderId);
                const paymentStatus = response.data?.data?.paymentStatus;

                if (paymentStatus === "COMPLETED" || paymentStatus === "PAID" || paymentStatus === "SUCCESS") {
                    setStatus("success");
                    // Auto-redirect after a few seconds
                    // setTimeout(() => {
                    //     navigate("/orders");
                    // }, 5000);
                } else {
                    setStatus("error");
                }
            } catch (error) {
                console.error("Payment verification failed:", error);
                setStatus("error");
            }
        };

        verifyPayment();
    }, [orderId, navigate]);

    if (status === "loading") {
        return (
            <div className="min-h-[80vh] bg-transparent flex items-center justify-center p-4" style={{ fontFamily: "'Rubik', sans-serif" }}>
                <div className="max-w-md w-full flex flex-col items-center">
                    <Loader2 className="h-12 w-12 text-green-600 animate-spin mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Verifying Payment...</h2>
                    <p className="text-muted-foreground mt-2 text-center text-gray-500">Please wait while we confirm your payment.</p>
                </div>
            </div>
        );
    }

    if (status === "error") {
        return (
            <div className="min-h-[80vh] bg-transparent flex flex-col md:flex-row items-center justify-center p-6 md:p-12 lg:p-24 overflow-hidden w-full" style={{ fontFamily: "'Rubik', sans-serif" }}>
                {/* Left Column: Content */}
                <div className="w-full md:w-1/2 flex flex-col justify-center space-y-8 max-w-lg z-10 px-4">
                    
                    <div className="space-y-4">
                        <h1 className={`text-4xl md:text-5xl font-extrabold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            Verification Failed
                        </h1>
                        <p className={`text-lg font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                            We could not verify your payment. Your order has not been placed. Please try again or contact our support if the issue persists.
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-4 pt-6">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button 
                                onClick={() => navigate("/orders")}
                                className={theme === 'dark' ? "bg-white hover:bg-gray-100 text-gray-900 px-8 py-6 text-base font-semibold shadow-sm rounded-md w-full sm:w-auto" : "bg-gray-900 hover:bg-gray-800 text-white px-8 py-6 text-base font-semibold shadow-sm hover:shadow-md transition-all rounded-md w-full sm:w-auto"}
                            >
                                View My Orders
                            </Button>
                            <Button 
                                onClick={() => navigate("/")}
                                variant="outline"
                                className={theme === 'dark' ? "px-8 py-6 text-base font-semibold border-2 border-white text-white hover:bg-gray-800 rounded-md w-full sm:w-auto transition-all" : "px-8 py-6 text-base font-semibold border-2 border-gray-900 text-gray-900 hover:bg-gray-100 rounded-md w-full sm:w-auto transition-all"}
                            >
                                Back to Home
                            </Button>
                        </div>
                        <Button 
                            onClick={() => window.location.href = 'tel:+355684460136'}
                            variant="outline"
                            className={theme === 'dark' ? "w-full sm:w-auto font-semibold border-2 border-white text-white hover:bg-gray-800 flex items-center justify-center py-6 mt-2 rounded-md transition-all" : "w-full sm:w-auto font-semibold border-2 border-gray-900 text-gray-900 hover:bg-gray-100 flex items-center justify-center py-6 mt-2 rounded-md transition-all"}
                        >
                            <Phone className="w-5 h-5 mr-2 text-rose-500" />
                            Contact Support (+355 68 44 60 136)
                        </Button>
                    </div>
                </div>

                {/* Right Column: Illustration Vector */}
                <div className="w-full md:w-1/2 flex justify-center items-center mt-12 md:mt-0 max-w-lg min-h-[300px]">
                    <div className="relative w-full aspect-square flex justify-center items-center">
                        <div className="absolute inset-0 bg-red-50/50 dark:bg-red-900/10 rounded-full blur-3xl -z-10"></div>
                        <img 
                            src="/payment_failed.png" 
                            alt="Payment Failed Vector" 
                            className="w-full max-w-[400px] h-auto object-contain animate-in fade-in zoom-in duration-700" 
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextElementSibling.style.display = 'flex';
                            }}
                        />
                        <div className="hidden flex-col items-center justify-center text-center p-8 border-2 border-dashed border-red-200 rounded-3xl w-full h-full text-red-700 bg-red-50/50">
                            <XCircle className="w-24 h-24 mb-4 text-red-500" />
                            <h3 className="text-2xl font-bold">Failed</h3>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[80vh] bg-transparent flex flex-col md:flex-row items-center justify-center p-6 md:p-12 lg:p-24 overflow-hidden w-full" style={{ fontFamily: "'Rubik', sans-serif" }}>
            {/* Left Column: Content */}
            <div className="w-full md:w-1/2 flex flex-col justify-center space-y-8 max-w-lg z-10 px-4">
                
                <div className="space-y-4">
                    <h1 className={`text-4xl md:text-5xl font-extrabold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        Payment successful
                    </h1>
                    <p className={`text-lg font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                        Thank you for your order! You will receive a confirmation email shortly. Your food is now being prepared.
                    </p>
                </div>

                {/* Progress Stepper */}
                <div className="relative pt-6 pb-2">
                    {/* Connecting line */}
                    <div className="absolute top-10 left-4 right-4 h-1 bg-gray-200 dark:bg-gray-800 rounded">
                        <div className="h-full bg-green-600 dark:bg-green-500 rounded w-1/2"></div>
                    </div>
                    
                    <div className="relative flex justify-between">
                        {/* Step 1 */}
                        <div className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center z-10 shadow-sm">
                                <Check className="w-5 h-5 text-white" strokeWidth={3} />
                            </div>
                            <span className={`mt-3 text-sm font-medium text-center w-24 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>Order Placed</span>
                        </div>
                        {/* Step 2 */}
                        <div className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center z-10 shadow-sm">
                                <Check className="w-5 h-5 text-white" strokeWidth={3} />
                            </div>
                            <span className={`mt-3 text-sm font-medium text-center w-28 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>Payment received</span>
                        </div>
                        {/* Step 3 */}
                        <div className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center z-10 border-2 border-white dark:border-gray-950">
                                <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />
                            </div>
                            <span className={`mt-3 text-sm font-medium text-center w-28 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Preparing food</span>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                    <Button 
                        onClick={() => navigate("/orders")}
                        className={theme === 'dark' ? "bg-white hover:bg-gray-100 text-gray-900 px-8 py-6 text-base font-semibold shadow-sm rounded-md" : "bg-gray-900 hover:bg-gray-800 text-white px-8 py-6 text-base font-semibold shadow-sm hover:shadow-md transition-all rounded-md"}
                    >
                        View My Orders
                    </Button>
                    <Button 
                        onClick={() => navigate("/")}
                        variant="outline"
                        className={theme === 'dark' ? "px-8 py-6 text-base font-semibold border-2 border-white text-white hover:bg-gray-800 rounded-md transition-all" : "px-8 py-6 text-base font-semibold border-2 border-gray-900 text-gray-900 hover:bg-gray-100 rounded-md transition-all"}
                    >
                        Back Home
                    </Button>
                </div>

                {/* Auto-redirect notice */}
                <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    Redirecting to your orders in a few seconds...
                </p>
            </div>

            {/* Right Column: Illustration Vector */}
            <div className="w-full md:w-1/2 flex justify-center items-center mt-12 md:mt-0 max-w-lg min-h-[300px]">
                <div className="relative w-full aspect-square flex justify-center items-center">
                    {/* Fallback pattern/confetti if image fails to load, but we load the primary image */}
                    <div className="absolute inset-0 bg-blue-50/50 dark:bg-blue-900/10 rounded-full blur-3xl -z-10"></div>
                    <img 
                        src={vector}
                        alt="Payment Success Celebration" 
                        className="w-full max-w-[500px] h-auto object-contain animate-in fade-in zoom-in duration-700"
                        onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextElementSibling.style.display = 'flex';
                        }}
                    />
                    {/* Fallback text block if no image is found */}
                    <div className="hidden flex-col items-center justify-center text-center p-8 border-2 border-dashed border-green-200 rounded-3xl w-full h-full text-green-700 bg-green-50/50">
                        <CheckCircle className="w-24 h-24 mb-4 text-green-500" />
                        <h3 className="text-2xl font-bold">Success!</h3>
                        <p className="text-green-600 mt-2">Your flavor journey begins.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentSuccess;

