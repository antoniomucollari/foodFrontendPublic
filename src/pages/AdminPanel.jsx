import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { categoryAPI, menuAPI, orderAPI } from "../services/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import AddCategoryModal from "../components/AddCategoryModal";
import AddMenuItemModal from "../components/AddMenuItemModal";
import EditCategoryModal from "../components/EditCategoryModal";
import EditMenuItemModal from "../components/EditMenuItemModal";
import {
  Plus,
  Edit,
  Trash2,
  Package,
  Users,
  ChefHat,
  ArrowLeft,
  Search,
  Filter,
} from "lucide-react";
import { Link } from "react-router-dom";

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState("orders");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showAddMenuItemModal, setShowAddMenuItemModal] = useState(false);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [showEditMenuItemModal, setShowEditMenuItemModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingMenuItem, setEditingMenuItem] = useState(null);
  const queryClient = useQueryClient();

  // Fetch data
  const {
    data: ordersData,
    isLoading: ordersLoading,
    error: ordersError,
  } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: () => orderAPI.getAllOrders({ page: 0, size: 20 }),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoryAPI.getAllCategories(),
  });

  const { data: menuData } = useQuery({
    queryKey: ["admin-menu", selectedCategory, searchTerm],
    queryFn: () =>
      menuAPI.getMenus({
        categoryId: selectedCategory,
        searchTerm: searchTerm || undefined,
      }),
  });

  const { data: customersData } = useQuery({
    queryKey: ["unique-customers"],
    queryFn: () => orderAPI.countUniqueCustomers(),
  });

  const { data: totalOrdersData } = useQuery({
    queryKey: ["dashboard-total-orders"],
    queryFn: () => orderAPI.getTotalOrders(),
  });

  // Mutations
  const deleteMenuMutation = useMutation({
    mutationFn: (id) => menuAPI.deleteMenu(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-menu"]);
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id) => categoryAPI.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["categories"]);
    },
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: (orderData) => orderAPI.updateOrderStatus(orderData),
    onSuccess: (data) => {
      queryClient.invalidateQueries(["admin-orders"]);

      // Messages are now handled by the API interceptor
      // No need to show duplicate messages here
    },
    onError: (error) => {
      console.error("Error updating order status:", error);
      // Error message will be handled by the global error handler
    },
  });

  // Debug logging
  console.log("Orders data:", ordersData);
  console.log("Orders error:", ordersError);
  console.log("Orders loading:", ordersLoading);

  const orders =
    ordersData?.data?.data?.content || ordersData?.data?.data || [];
  const categories = categoriesData?.data?.data || [];
  const menuItems = menuData?.data?.data || [];
  // Handle new unique customers response structure
  const uniqueCustomersResponse = customersData?.data?.data || {};
  const uniqueCustomers =
    uniqueCustomersResponse?.totalUniqueCustomers ||
    uniqueCustomersResponse?.currentMonthCustomers ||
    uniqueCustomersResponse ||
    0;

  // Handle new total orders response structure
  const totalOrdersResponse = totalOrdersData?.data?.data || {};
  const totalOrders =
    totalOrdersResponse?.totalOrders ||
    totalOrdersResponse?.currentMonthOrders ||
    totalOrdersResponse ||
    0;

  const getOrderStatusColor = (status) => {
    switch (status) {
      case "INITIALIZED":
        return "bg-gray-100 text-gray-800";
      case "CONFIRMED":
        return "bg-blue-100 text-blue-800";
      case "ON_THE_WAY":
        return "bg-purple-100 text-purple-800";
      case "DELIVERED":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      case "FAILED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "PENDING_PAYMENT":
        return "bg-blue-100 text-blue-800";
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      case "FAILED":
        return "bg-red-100 text-red-800";
      case "CANCELED":
        return "bg-red-100 text-red-800";
      case "REFUNDED":
        return "bg-orange-100 text-orange-800";
      case "TO_REFUND":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDeleteMenu = (id) => {
    if (window.confirm("Are you sure you want to delete this menu item?")) {
      deleteMenuMutation.mutate(id);
    }
  };

  const handleDeleteCategory = (id) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      deleteCategoryMutation.mutate(id);
    }
  };

  const handleUpdateOrderStatus = (orderId, newStatus, statusType) => {
    const updateData = { id: orderId };
    if (statusType === "orderStatus") {
      updateData.orderStatus = newStatus;
    } else if (statusType === "paymentStatus") {
      updateData.paymentStatus = newStatus;
    }
    updateOrderStatusMutation.mutate(updateData);
  };

  const tabs = [
    { id: "orders", name: "Orders", icon: Package },
    { id: "menu", name: "Menu Management", icon: ChefHat },
    { id: "categories", name: "Categories", icon: Filter },
    { id: "customers", name: "Customers", icon: Users },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" asChild>
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Admin Panel</h1>
        </div>
        <Button asChild>
          <Link to="/new-orders">
            <Package className="h-4 w-4 mr-2" />
            Active Orders
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Orders
                </p>
                <p className="text-2xl font-bold">{totalOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <ChefHat className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Menu Items</p>
                <p className="text-2xl font-bold">{menuItems.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Filter className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Categories</p>
                <p className="text-2xl font-bold">{categories.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Customers</p>
                <p className="text-2xl font-bold">{uniqueCustomers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === "orders" && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Recent Orders</h2>

            {ordersLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-2">Loading orders...</span>
              </div>
            )}

            {ordersError && (
              <div className="bg-destructive/10 text-destructive p-4 rounded-md">
                Error loading orders: {ordersError.message}
              </div>
            )}

            {!ordersLoading && !ordersError && orders.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No orders found</p>
              </div>
            )}

            {!ordersLoading &&
              !ordersError &&
              orders.map((order) => (
                <Card key={order.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold">
                          Order #{order.id}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Customer: {order.user?.email}
                        </p>
                        <p className="text-sm text-gray-600">
                          Date: {formatDate(order.orderDate)}
                        </p>
                        <p className="text-sm text-gray-600">
                          Total: ${order.totalAmount?.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="space-y-1">
                          <Badge
                            className={getOrderStatusColor(order.orderStatus)}
                          >
                            Order: {order.orderStatus?.replace("_", " ")}
                          </Badge>
                          <Badge
                            className={getPaymentStatusColor(
                              order.paymentStatus
                            )}
                          >
                            Payment: {order.paymentStatus?.replace("_", " ")}
                          </Badge>
                        </div>
                        <div className="mt-2 space-y-2">
                          <div>
                            <label className="text-xs text-gray-600">
                              Order Status
                            </label>
                            <select
                              value={order.orderStatus || ""}
                              onChange={(e) =>
                                handleUpdateOrderStatus(
                                  order.id,
                                  e.target.value,
                                  "orderStatus"
                                )
                              }
                              className="w-full px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-sm hover:shadow-md transition-all duration-200 focus:border-transparent cursor-pointer"
                            >
                              <option value="INITIALIZED">Initialized</option>
                              <option value="CONFIRMED">Confirmed</option>
                              <option value="ON_THE_WAY">On The Way</option>
                              <option value="DELIVERED">Delivered</option>
                              <option value="CANCELLED">Cancelled</option>
                              <option value="FAILED">Failed</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-xs text-gray-600">
                              Payment Status
                            </label>
                            <select
                              value={order.paymentStatus || ""}
                              onChange={(e) =>
                                handleUpdateOrderStatus(
                                  order.id,
                                  e.target.value,
                                  "paymentStatus"
                                )
                              }
                              className="w-full px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-sm hover:shadow-md transition-all duration-200 focus:border-transparent cursor-pointer"
                            >
                              <option value="PENDING">Pending</option>
                              <option value="PENDING_PAYMENT">Pending Payment</option>
                      <option value="EXPIRED">Expired</option>
                      <option value="ABANDONED">Abandoned</option>
                              <option value="COMPLETED">Completed</option>
                              <option value="REJECTED">Rejected</option>
                              <option value="FAILED">Failed</option>
                              <option value="REFUNDED">Refunded</option>
                              <option value="CANCELED">Canceled</option>
                              <option value="TO_REFUND">To Refund</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}

        {activeTab === "menu" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Menu Management</h2>
              <Button onClick={() => setShowAddMenuItemModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Menu Item
              </Button>
            </div>

            <div className="flex space-x-4">
              <div className="flex-1">
                <Input
                  placeholder="Search menu items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                value={selectedCategory || ""}
                onChange={(e) => setSelectedCategory(e.target.value || null)}
                className="px-3 py-2 border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {menuItems.map((item) => (
                <Card key={item.id}>
                  <img
                    src={item.imageUrl || "/placeholder-food.jpg"}
                    alt={item.name}
                    className="w-full h-48 object-cover"
                  />
                  <CardContent className="p-4">
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {item.description}
                    </p>
                    <p className="font-bold text-lg">
                      ${item.price?.toFixed(2)}
                    </p>
                    <div className="flex space-x-2 mt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingMenuItem(item);
                          setShowEditMenuItemModal(true);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteMenu(item.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === "categories" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Categories</h2>
              <Button onClick={() => setShowAddCategoryModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category) => (
                <Card key={category.id}>
                  <CardContent className="p-4">
                    <h3 className="font-semibold">{category.name}</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      {category.description}
                    </p>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingCategory(category);
                          setShowEditCategoryModal(true);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteCategory(category.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === "customers" && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Customer Statistics</h2>
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <Users className="h-16 w-16 text-primary mx-auto mb-4" />
                  <h3 className="text-2xl font-bold mb-2">Total Customers</h3>
                  <p className="text-4xl font-bold text-primary">
                    {uniqueCustomers}
                  </p>
                  <p className="text-gray-600 mt-2">
                    Unique customers who have placed orders
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddCategoryModal
        isOpen={showAddCategoryModal}
        onClose={() => setShowAddCategoryModal(false)}
      />
      <AddMenuItemModal
        isOpen={showAddMenuItemModal}
        onClose={() => setShowAddMenuItemModal(false)}
      />
      <EditCategoryModal
        isOpen={showEditCategoryModal}
        onClose={() => {
          setShowEditCategoryModal(false);
          setEditingCategory(null);
        }}
        category={editingCategory}
      />
      <EditMenuItemModal
        isOpen={showEditMenuItemModal}
        onClose={() => {
          setShowEditMenuItemModal(false);
          setEditingMenuItem(null);
        }}
        menuItem={editingMenuItem}
      />
    </div>
  );
};

export default AdminPanel;
