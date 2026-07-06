import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { orderAPI } from "../../services/api";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { BarChart3, TrendingUp, Calendar, TrendingDown } from "lucide-react";
import MonthlyRevenueChart from "./MonthlyRevenueChart";
import DailyRevenueChart from "./DailyRevenueChart";

const GraphsSection = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  // Fetch total revenue data
  const { data: totalRevenueResponse } = useQuery({
    queryKey: ["dashboard-total-revenue"],
    queryFn: () => orderAPI.getTotalRevenue(),
  });

  // Handle new revenue statistics response structure
  const totalRevenueData = totalRevenueResponse?.data?.data || {};
  const totalRevenue =
    totalRevenueData?.totalRevenue ||
    totalRevenueData?.currentMonthRevenue ||
    0;
  const currentMonthDifference =
    totalRevenueData?.currentMonthRevenue ||
    totalRevenueData?.currentMonth ||
    0;
  const previousMonthRevenue =
    totalRevenueData?.previousMonthRevenue ||
    totalRevenueData?.previousMonth ||
    0;
  const percentageChange =
    totalRevenueData?.percentageDifference ||
    totalRevenueData?.percentageChange ||
    0;

  // Helper functions
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("sq-AL", {
      style: "currency",
      currency: "ALL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercentage = (percentage) => {
    const sign = percentage >= 0 ? "+" : "";
    return `${sign}${percentage.toFixed(1)}%`;
  };

  const getPercentageColor = (percentage) => {
    return percentage >= 0 ? "text-green-500" : "text-red-500";
  };

  // Generate year options (current year and previous 5 years)
  const yearOptions = Array.from(
    { length: 6 },
    (_, i) => new Date().getFullYear() - i
  );

  // Generate month options
  const monthOptions = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  return (
    <div className="space-y-6 p-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Revenue Analytics
          </h1>
          <p className="text-muted-foreground">
            Monthly and daily revenue analysis
          </p>
        </div>
      </div>

      {/* Charts Container - Centered with max width */}
      <div className="flex flex-col items-center space-y-6">
        {/* Monthly Revenue Chart */}
        <div className="w-full max-w-4xl">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Monthly Revenue Analysis
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="px-3 py-2 border border-border rounded-lg bg-background text-foreground shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer"
                  >
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <MonthlyRevenueChart year={selectedYear} />
            </CardContent>
          </Card>
        </div>

        {/* Daily Revenue Chart */}
        <div className="w-full max-w-4xl">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Daily Revenue Analysis
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="px-3 py-2 border border-border rounded-lg bg-background text-foreground shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer"
                  >
                    {monthOptions.map((month) => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="px-3 py-2 border border-border rounded-lg bg-background text-foreground shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer"
                  >
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <DailyRevenueChart year={selectedYear} month={selectedMonth} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Additional Analytics Cards */}
      <div className="flex justify-center">
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Previous Month
                  </p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(previousMonthRevenue)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Last month's revenue
                  </p>
                </div>
                <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Current Month
                  </p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(currentMonthDifference)}
                  </p>
                </div>
                <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default GraphsSection;
