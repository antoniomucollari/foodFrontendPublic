import React from "react";
import { useQuery } from "@tanstack/react-query";
import { orderAPI } from "../../services/api";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

const OrderStatusChart = () => {
  const { data: statusData } = useQuery({
    queryKey: ["order-status-distribution"],
    queryFn: () => orderAPI.getOrderStatusDistribution(),
  });

  const statusDistribution = statusData?.data?.data || {};

  const statusColors = {
    INITIALIZED: "#fbbf24", // yellow
    CONFIRMED: "#3b82f6", // blue
    ON_THE_WAY: "#f59e0b", // orange
    DELIVERED: "#10b981", // teal
    CANCELLED: "#ec4899", // pink
    FAILED: "#ef4444", // red
  };

  const statusLabels = {
    INITIALIZED: "Initialized",
    CONFIRMED: "Confirmed",
    ON_THE_WAY: "On the way",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled",
    FAILED: "Failed",
  };

  const totalOrders = Object.values(statusDistribution).reduce(
    (sum, count) => sum + count,
    0
  );

  if (totalOrders === 0) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-center">
          <p className="text-muted-foreground">No order data available</p>
          <p className="text-xs text-muted-foreground mt-2">PIE CHART GRAPH</p>
        </div>
      </div>
    );
  }

  // Transform data for recharts
  const chartData = Object.entries(statusDistribution).map(
    ([status, count]) => ({
      name: statusLabels[status],
      value: count,
      color: statusColors[status],
    })
  );

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{payload[0].name}</p>
          <p className="text-sm text-muted-foreground">
            Orders: {payload[0].value}
          </p>
          <p className="text-sm text-muted-foreground">
            Percentage: {((payload[0].value / totalOrders) * 100).toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Pie Chart */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="space-y-2">
        {chartData.map((entry, index) => (
          <div
            key={index}
            className="flex items-center justify-between text-sm"
          >
            <div className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{entry.name}</span>
            </div>
            <span className="font-medium">{entry.value} customers</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderStatusChart;
