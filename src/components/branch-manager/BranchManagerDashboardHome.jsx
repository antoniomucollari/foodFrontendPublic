import React from "react";
import { useQuery } from "@tanstack/react-query";
import { analyticsAPI } from "../../services/api";
import { Card, CardContent } from "../ui/card";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { Banknote, Package, Users, TrendingUp, TrendingDown } from "lucide-react";
import MonthlyRevenueChart from "../admin/MonthlyRevenueChart";
import DailyRevenueChart from "../admin/DailyRevenueChart";

const BranchManagerDashboardHome = () => {
    // Current date
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Fetch data using analyticsAPI
    // Key Metrics
    const { data: uniqueCustomersData, error: uniqueCustomersError } = useQuery({
        queryKey: ["branch-manager-unique-customers"],
        queryFn: () => analyticsAPI.getUniqueCustomerMetrics(),
    });

    const { data: popularItemsData, error: popularItemsError } = useQuery({
        queryKey: ["branch-manager-popular-items"],
        queryFn: () => analyticsAPI.getMostPopularItems(5),
    });

    // TODO: We need matching endpoints for Total Orders and Total Revenue if not provided by getUniqueCustomerMetrics
    // For now we will ommit Total Orders/Revenue cards if we don't have the data, or reuse invalid ones?
    // User only provided 4 endpoints.
    // I will display Unique Customers and Popular Items, and the Revenue Charts.

    const uniqueCustomersResponse = uniqueCustomersData?.data || {};
    // Check structure based on DTO
    const uniqueCustomers = uniqueCustomersResponse.totalUniqueCustomers || 0;
    const uniqueCustomersPercentageChange = uniqueCustomersResponse.percentageDifference || 0;

    const popularItems = popularItemsData?.data || [];

    const formatPercentage = (percentage) => {
        const sign = percentage >= 0 ? "+" : "";
        return `${sign}${percentage.toFixed(1)}%`;
    };

    const getPercentageColor = (percentage) => {
        return percentage >= 0 ? "text-green-500" : "text-red-500";
    };

    return (
        <div className="space-y-6 p-6 w-full">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Branch Manager Dashboard</h1>
                    <p className="text-muted-foreground">Overview of branch performance</p>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Active Customers */}
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Unique Customers
                                </p>
                                <p className="text-2xl font-bold">
                                    {uniqueCustomers.toLocaleString()}
                                </p>
                                <div className="flex items-center mt-2">
                                    {uniqueCustomersPercentageChange >= 0 ? (
                                        <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                                    ) : (
                                        <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                                    )}
                                    <span
                                        className={`text-sm ${getPercentageColor(
                                            uniqueCustomersPercentageChange
                                        )} cursor-help`}
                                        title="this month vs last month"
                                    >
                                        {formatPercentage(uniqueCustomersPercentageChange)}
                                    </span>
                                </div>
                            </div>
                            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                                <Users className="h-6 w-6 text-primary" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Top Popular Item */}
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Top Item</p>
                                {popularItems.length > 0 ? (
                                    <div>
                                        <p className="text-lg font-bold truncate max-w-[150px]" title={popularItems[0].itemName}>{popularItems[0].itemName}</p>
                                        <p className="text-xs text-muted-foreground">{popularItems[0].orderCount} orders</p>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No data</p>
                                )}
                            </div>
                            {popularItems.length > 0 && popularItems[0].imageUrl && (
                                <img
                                    src={popularItems[0].imageUrl}
                                    alt={popularItems[0].itemName}
                                    className="h-12 w-12 rounded-lg object-cover"
                                    onError={(e) => {
                                        e.target.src = "/placeholder-food.jpg";
                                    }}
                                />
                            )}
                            {(!popularItems.length || !popularItems[0].imageUrl) && (
                                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                                    <Package className="h-6 w-6 text-primary" />
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Revenue Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="col-span-1">
                    <CardContent className="pt-6">
                        <MonthlyRevenueChart year={currentYear} />
                    </CardContent>
                </Card>
                <Card className="col-span-1">
                    <CardContent className="pt-6">
                        <DailyRevenueChart year={currentYear} month={currentMonth} />
                    </CardContent>
                </Card>
            </div>

            {/* Popular Items List */}
            <Card>
                <div className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Popular Items</h3>
                    <div className="space-y-4">
                        {popularItems.map((item, index) => (
                            <div key={index} className="flex items-center justify-between border-b border-border pb-2 last:border-0 last:pb-0">
                                <div className="flex items-center space-x-3">
                                    <div className="font-bold text-muted-foreground w-6">#{index + 1}</div>
                                    <img
                                        src={item.imageUrl || "/placeholder-food.jpg"}
                                        alt={item.itemName}
                                        className="h-10 w-10 rounded-md object-cover"
                                        onError={(e) => e.target.src = "/placeholder-food.jpg"}
                                    />
                                    <div>
                                        <p className="font-medium">{item.itemName}</p>
                                    </div>
                                </div>
                                <div className="text-sm font-semibold">{item.orderCount} orders</div>
                            </div>
                        ))}
                        {popularItems.length === 0 && <p className="text-muted-foreground">No popular items data.</p>}
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default BranchManagerDashboardHome;
