import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { analyticsAPI, orderAPI } from "../../services/api";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Banknote, Package, Users, TrendingUp, TrendingDown } from "lucide-react";
import MonthlyRevenueChart from "../admin/MonthlyRevenueChart";
import DailyRevenueChart from "../admin/DailyRevenueChart";

const ManagerDashboardHome = () => {
    // Current year/month for charts
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);

    // Fetch Total Orders
    const { data: totalOrdersData, error: totalOrdersError } = useQuery({
        queryKey: ["manager-total-orders"],
        queryFn: () => analyticsAPI.getSuccessfulOrders(),
    });

    // Fetch Monthly Revenue (used to calculate total revenue for the year)
    const { data: monthlyRevenueData, error: monthlyRevenueError } = useQuery({
        queryKey: ["manager-monthly-revenue", selectedYear],
        queryFn: () => analyticsAPI.getMonthlyRevenue(selectedYear),
    });

    // Fetch Unique Customers
    const { data: uniqueCustomersData, error: uniqueCustomersError } = useQuery({
        queryKey: ["manager-unique-customers"],
        queryFn: () => analyticsAPI.getUniqueCustomerMetrics(),
    });

    // Fetch Most Popular Items
    const { data: mostPopularData, error: mostPopularError } = useQuery({
        queryKey: ["manager-most-popular"],
        queryFn: () => analyticsAPI.getMostPopularItems(1),
    });

    // Extract Data
    // For successful-orders endpoint, response structure is { data: 8, ... } inside the axios response
    const totalOrders = totalOrdersData?.data?.data || 0;

    const monthlyRevenueList = monthlyRevenueData?.data?.data || [];
    // Sum revenue for the year
    const totalRevenue = monthlyRevenueList.reduce(
        (sum, item) => sum + (item.revenue || 0),
        0
    );

    const uniqueCustomersResponse = uniqueCustomersData?.data?.data || {};
    const uniqueCustomers =
        uniqueCustomersResponse?.totalUniqueCustomers ||
        uniqueCustomersResponse?.currentMonthCustomers ||
        0;
    const uniqueCustomersPercentageChange =
        uniqueCustomersResponse?.percentageDifference || 0;

    const mostOrderedList = mostPopularData?.data || [];
    const mostOrdered = mostOrderedList.length > 0 ? mostOrderedList[0] : null;

    // Formatting Helpers
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("sq-AL", {
            style: "currency",
            currency: "ALL",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount || 0);
    };

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
                    <h1 className="text-3xl font-bold text-foreground">Manager Dashboard</h1>
                    <p className="text-muted-foreground">Overview of restaurant performance</p>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Revenue ({selectedYear})</p>
                                <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
                            </div>
                            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                                <Banknote className="h-6 w-6 text-primary" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                                <p className="text-2xl font-bold">{totalOrders.toLocaleString()}</p>
                            </div>
                            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                                <Package className="h-6 w-6 text-primary" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Active Customers
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
                                        {uniqueCustomersPercentageChange !== 0
                                            ? formatPercentage(uniqueCustomersPercentageChange)
                                            : "0.0%"}
                                    </span>
                                </div>
                            </div>
                            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                                <Users className="h-6 w-6 text-primary" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Most Ordered Item Card */}
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Most Popular</p>
                                {mostOrdered ? (
                                    <div>
                                        <p className="text-lg font-bold truncate max-w-[150px]" title={mostOrdered.itemName}>{mostOrdered.itemName}</p>
                                        <p className="text-xs text-muted-foreground">{mostOrdered.orderCount} orders</p>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No data</p>
                                )}
                            </div>
                            {mostOrdered?.imageUrl && (
                                <img
                                    src={mostOrdered.imageUrl}
                                    alt={mostOrdered.itemName}
                                    className="h-12 w-12 rounded-lg object-cover"
                                    onError={(e) => {
                                        e.target.src = "/placeholder-food.jpg";
                                    }}
                                />
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardContent className="p-4">
                        <MonthlyRevenueChart year={selectedYear} />
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <DailyRevenueChart year={selectedYear} month={selectedMonth} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ManagerDashboardHome;
