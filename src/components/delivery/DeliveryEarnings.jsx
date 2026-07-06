import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { analyticsAPI } from "../../services/api";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Wallet, Info, Loader2 } from "lucide-react";

const DeliveryEarnings = () => {
    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState(currentYear.toString());

    const { data: earningsData, isLoading, error } = useQuery({
        queryKey: ["delivery-earnings", selectedYear],
        // Omit deliveryId for delivery person view as requested
        queryFn: () => analyticsAPI.getDeliveryEarnings(parseInt(selectedYear)),
    });

    const generateYearOptions = () => {
        const years = [];
        for (let i = 0; i < 5; i++) {
            years.push((currentYear - i).toString());
        }
        return years;
    };

    const chartData = earningsData?.data?.data || [];

    // Calculate total earnings for the year
    const totalYearEarnings = chartData.reduce((sum, item) => sum + (item.revenue || 0), 0);

    return (
        <div className="space-y-6 p-6 w-full fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Earnings</h1>
                    <p className="text-muted-foreground mt-2">
                        View your delivery earnings over time.
                    </p>
                </div>

                <div className="w-full sm:w-48">
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Year" />
                        </SelectTrigger>
                        <SelectContent>
                            {generateYearOptions().map((year) => (
                                <SelectItem key={year} value={year}>
                                    {year}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Card className="border-indigo-200 bg-indigo-50 dark:border-indigo-800/50 dark:bg-indigo-950/30">
                <CardContent className="p-4 flex gap-4 items-center">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-full shrink-0">
                        <Info className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-indigo-900 dark:text-indigo-100">How earnings are calculated</h3>
                        <p className="text-sm text-indigo-800 dark:text-indigo-300 mt-1">
                            You earn <strong>50%</strong> of the delivery cost + <strong>100%</strong> of the tip for deliveries costing more than 100 Lek.
                            For deliveries under 80 Lek, you keep <strong>100%</strong> of the delivery cost plus the full tip.
                        </p>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Earnings ({selectedYear})
                        </CardTitle>
                        <Wallet className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="h-8 w-24 bg-muted animate-pulse rounded"></div>
                        ) : (
                            <div className="text-3xl font-bold">{totalYearEarnings.toFixed(2)} Lek</div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Monthly Earnings Overview</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="h-[400px] flex items-center justify-center">
                            <Loader2 className="h-8 w-8 text-primary animate-spin" />
                        </div>
                    ) : error ? (
                        <div className="h-[400px] flex items-center justify-center text-red-500">
                            Failed to load earnings data.
                        </div>
                    ) : chartData.length === 0 ? (
                        <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                            No earnings data found for {selectedYear}.
                        </div>
                    ) : (
                        <div className="h-[400px] mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                                    <XAxis
                                        dataKey="month"
                                        className="text-xs"
                                        tick={{ fill: "currentColor" }}
                                    />
                                    <YAxis
                                        className="text-xs"
                                        tick={{ fill: "currentColor" }}
                                        tickFormatter={(value) => `${value}L`}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: "var(--background)", borderColor: "var(--border)", borderRadius: "8px" }}
                                        itemStyle={{ color: "var(--primary)" }}
                                        formatter={(value) => [`${value} Lek`, "Earnings"]}
                                    />
                                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default DeliveryEarnings;
