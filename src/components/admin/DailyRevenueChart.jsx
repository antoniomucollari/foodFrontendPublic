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

const DailyRevenueChart = ({ year, month, targetBranchId, targetRestaurantId }) => {
  const { data: dailyData, isLoading } = useQuery({
    queryKey: ["daily-revenue", year, month, targetBranchId, targetRestaurantId],
    queryFn: () => analyticsAPI.getDailyRevenue(year, month, targetBranchId, targetRestaurantId),
  });

  const dailyRevenue = dailyData?.data?.data || [];

  // Get number of days in the month
  const daysInMonth = new Date(year, month, 0).getDate();

  // Create a map of day to revenue
  const revenueMap = dailyRevenue.reduce((acc, item) => {
    acc[item.day] = item.revenue;
    return acc;
  }, {});

  // Get all days in the month with their revenue
  const chartData = Array.from({ length: daysInMonth }, (_, index) => ({
    day: index + 1,
    revenue: revenueMap[index + 1] || 0,
  }));

  const maxRevenue = Math.max(...chartData.map((item) => item.revenue));
  const monthName = new Date(year, month - 1).toLocaleDateString("en-US", {
    month: "long",
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading daily revenue data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Chart Title */}
      <div className="text-center">
        <h3 className="text-lg font-semibold">
          Daily Revenue - {monthName} {year}
        </h3>
      </div>

      {/* Chart */}
      <div className="h-80 w-full overflow-x-auto">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            className="min-w-full"
          >
            <defs>
              <linearGradient
                id="dailyRevenueGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
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
              dataKey="day"
              tick={{
                fontSize: 10,
                fill: "hsl(var(--muted-foreground))",
                fontWeight: 500,
              }}
              tickLine={{ stroke: "hsl(var(--border))", opacity: 0.5 }}
              axisLine={{ stroke: "hsl(var(--border))", opacity: 0.5 }}
              interval="preserveStartEnd"
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
                        <p className="font-medium text-foreground">
                          Day {label}
                        </p>
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
              fill="url(#dailyRevenueGradient)"
              dot={{
                fill: "hsl(var(--primary))",
                strokeWidth: 2,
                stroke: "hsl(var(--background))",
                r: 3,
              }}
              activeDot={{
                r: 5,
                stroke: "hsl(var(--primary))",
                strokeWidth: 2,
                fill: "hsl(var(--background))",
                strokeDasharray: "",
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <div className="bg-card border border-border rounded-lg p-4 text-center hover:bg-accent/50 transition-colors">
          <p className="text-sm font-medium text-muted-foreground mb-1">
            Total Revenue
          </p>
          <p className="text-xl font-bold text-foreground">
            {new Intl.NumberFormat("sq-AL", {
              style: "currency",
              currency: "ALL",
            }).format(chartData.reduce((sum, item) => sum + item.revenue, 0))}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 text-center hover:bg-accent/50 transition-colors">
          <p className="text-sm font-medium text-muted-foreground mb-1">
            Best Day
          </p>
          <p className="text-xl font-bold text-foreground">
            {chartData.find((item) => item.revenue === maxRevenue)?.day ||
              "N/A"}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 text-center hover:bg-accent/50 transition-colors">
          <p className="text-sm font-medium text-muted-foreground mb-1">
            Average per Day
          </p>
          <p className="text-xl font-bold text-foreground">
            {new Intl.NumberFormat("sq-AL", {
              style: "currency",
              currency: "ALL",
            }).format(
              chartData.reduce((sum, item) => sum + item.revenue, 0) /
              daysInMonth
            )}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 text-center hover:bg-accent/50 transition-colors">
          <p className="text-sm font-medium text-muted-foreground mb-1">
            Active Days
          </p>
          <p className="text-xl font-bold text-foreground">
            {chartData.filter((item) => item.revenue > 0).length}
          </p>
        </div>
      </div>

      {/*/!* Legend *!/*/}
      {/*<div className="text-center text-xs text-muted-foreground">*/}
      {/*  <p>Hover over the line to see exact revenue amounts</p>*/}
      {/*</div>*/}
    </div>
  );
};

export default DailyRevenueChart;
