import React from "react";
import { useQuery } from "@tanstack/react-query";
import { analyticsAPI } from "../../services/api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

const MonthlyRevenueChart = ({ year, targetBranchId, targetRestaurantId }) => {
  const {
    data: monthlyData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["monthly-revenue", year, targetBranchId, targetRestaurantId],
    queryFn: () => analyticsAPI.getMonthlyRevenue(year, targetBranchId, targetRestaurantId),
  });

  const monthlyRevenue = monthlyData?.data?.data || [];

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Create a map of month name to revenue
  const revenueMap = monthlyRevenue.reduce((acc, item) => {
    acc[item.month] = item.revenue;
    return acc;
  }, {});

  // Get all 12 months with their revenue
  const chartData = monthNames.map((month) => ({
    month: month.substring(0, 3), // Short month name
    fullMonth: month,
    revenue: revenueMap[month] || 0,
  }));

  const maxRevenue = Math.max(...chartData.map((item) => item.revenue));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading monthly revenue data...</span>
      </div>
    );
  }

  if (error) {
    console.error("Error fetching monthly revenue:", error);
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-500 mb-2">
            Error loading monthly revenue data
          </p>
          <p className="text-sm text-muted-foreground">
            {error.response?.data?.message || error.message}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Year: {year}, URL: /analytics/revenue/monthly?year={year}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Chart Title */}
      <div className="text-center">
        <h3 className="text-lg font-semibold">Monthly Revenue - {year}</h3>
      </div>

      {/* Chart */}
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="hsl(var(--primary))"
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor="hsl(var(--primary))"
                  stopOpacity={0.05}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              className="opacity-30"
              stroke="hsl(var(--border))"
            />
            <XAxis
              dataKey="month"
              tick={{
                fontSize: 12,
                fill: "hsl(var(--muted-foreground))",
                fontWeight: 500,
              }}
              tickLine={{ stroke: "hsl(var(--border))", opacity: 0.5 }}
              axisLine={{ stroke: "hsl(var(--border))", opacity: 0.5 }}
            />
            <YAxis
              tick={{
                fontSize: 12,
                fill: "hsl(var(--muted-foreground))",
                fontWeight: 500,
              }}
              tickLine={{ stroke: "hsl(var(--border))", opacity: 0.5 }}
              axisLine={{ stroke: "hsl(var(--border))", opacity: 0.5 }}
              tickFormatter={(value) =>
                new Intl.NumberFormat("sq-AL", {
                  style: "currency",
                  currency: "ALL",
                  maximumFractionDigits: 0,
                }).format(value)
              }
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-card border border-border rounded-lg p-4 shadow-lg backdrop-blur-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-primary"></div>
                        <p className="font-medium text-foreground">{label}</p>
                      </div>
                      <p className="text-primary font-semibold text-lg mt-1">
                        {new Intl.NumberFormat("sq-AL", {
                          style: "currency",
                          currency: "ALL",
                        }).format(payload[0].value)}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
              cursor={{
                stroke: "hsl(var(--primary))",
                strokeWidth: 1,
                strokeDasharray: "5 5",
                opacity: 0.5,
              }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#revenueGradient)"
              dot={{
                fill: "hsl(var(--primary))",
                strokeWidth: 2,
                stroke: "hsl(var(--background))",
                r: 4,
              }}
              activeDot={{
                r: 6,
                stroke: "hsl(var(--primary))",
                strokeWidth: 2,
                fill: "hsl(var(--background))",
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="bg-card border border-border rounded-lg p-4 text-center hover:bg-accent/50 transition-colors">
          <p className="text-sm font-medium text-muted-foreground mb-1">
            Total Revenue This Year
          </p>
          <p className="text-2xl font-bold text-foreground">
            {new Intl.NumberFormat("sq-AL", {
              style: "currency",
              currency: "ALL",
            }).format(chartData.reduce((sum, item) => sum + item.revenue, 0))}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 text-center hover:bg-accent/50 transition-colors">
          <p className="text-sm font-medium text-muted-foreground mb-1">
            Best Month
          </p>
          <p className="text-2xl font-bold text-foreground">
            {chartData.find((item) => item.revenue === maxRevenue)?.fullMonth ||
              "N/A"}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 text-center hover:bg-accent/50 transition-colors">
          <p className="text-sm font-medium text-muted-foreground mb-1">
            Average per Month
          </p>
          <p className="text-2xl font-bold text-foreground">
            {new Intl.NumberFormat("sq-AL", {
              style: "currency",
              currency: "ALL",
            }).format(
              chartData.reduce((sum, item) => sum + item.revenue, 0) / 12
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MonthlyRevenueChart;
