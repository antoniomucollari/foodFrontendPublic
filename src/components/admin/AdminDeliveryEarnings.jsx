import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { analyticsAPI, userAPI } from "../../services/api";
import { getPageContent } from "../../utils/apiResponse";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Wallet, Truck, Loader2 } from "lucide-react";

const AdminDeliveryEarnings = () => {
    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState(currentYear.toString());
    const [selectedDriverId, setSelectedDriverId] = useState("");

    // Fetch all delivery personnel
    const { data: driversData, isLoading: isLoadingDrivers } = useQuery({
        queryKey: ["delivery-personnel"],
        queryFn: () => userAPI.getAllUsers("DELIVERY", "", { size: 1000 }),
    });

    const drivers = getPageContent(driversData);

    // Automatically select the first driver if none is chosen and drivers are available
    useEffect(() => {
        if (!selectedDriverId && drivers.length > 0) {
            setSelectedDriverId(drivers[0].id.toString());
        }
    }, [drivers, selectedDriverId]);

    const { data: earningsData, isLoading, error } = useQuery({
        queryKey: ["admin-delivery-earnings", selectedYear, selectedDriverId],
        queryFn: () => analyticsAPI.getDeliveryEarnings(parseInt(selectedYear), parseInt(selectedDriverId)),
        enabled: !!selectedDriverId,
    });

    const generateYearOptions = () => {
        const years = [];
        for (let i = 0; i < 5; i++) {
            years.push((currentYear - i).toString());
        }
        return years;
    };

    const chartData = earningsData?.data?.data || [];

    // Calculate total earnings
    const totalYearEarnings = chartData.reduce((sum, item) => sum + (item.revenue || 0), 0);

    return (
        <div className="space-y-6 p-6 w-full fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Delivery Earnings</h1>
                    <p className="text-muted-foreground mt-2">
                        View earnings for specific delivery personnel.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row w-full md:w-auto gap-4">
                    <div className="w-full sm:w-64">
                        <Select value={selectedDriverId} onValueChange={setSelectedDriverId} disabled={isLoadingDrivers || drivers.length === 0}>
                            <SelectTrigger>
                                <SelectValue placeholder={isLoadingDrivers ? "Loading drivers..." : "Select Driver"} />
                            </SelectTrigger>
                            <SelectContent>
                                {drivers.map((driver) => (
                                    <SelectItem key={driver.id} value={driver.id.toString()}>
                                        {driver.name || driver.email} (ID: {driver.id})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="w-full sm:w-32">
                        <Select value={selectedYear} onValueChange={setSelectedYear}>
                            <SelectTrigger>
                                <SelectValue placeholder="Year" />
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
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Personnel Earnings ({selectedYear})
                        </CardTitle>
                        <Wallet className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        {!selectedDriverId ? (
                            <div className="text-sm text-muted-foreground">Select a driver first</div>
                        ) : isLoading ? (
                            <div className="h-8 w-24 bg-muted animate-pulse rounded"></div>
                        ) : (
                            <div className="text-3xl font-bold">{totalYearEarnings.toFixed(2)} Lek</div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                        <span>Monthly Earnings Overview</span>
                        <Truck className="h-5 w-5 text-muted-foreground" />
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {!selectedDriverId ? (
                        <div className="h-[400px] flex flex-col items-center justify-center text-muted-foreground bg-muted/20 rounded-lg">
                            <Truck className="h-12 w-12 mb-4 opacity-50" />
                            <p>Please select a delivery person to view their earnings history</p>
                        </div>
                    ) : isLoading ? (
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

export default AdminDeliveryEarnings;
