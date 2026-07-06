import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./styles/toastify-custom.css";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { CartProvider } from "./contexts/CartContext";
import { ToastProvider } from "./contexts/ToastContext";
import { CartToastProvider } from "./contexts/CartToastContext";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Menu from "./pages/Menu";

import Orders from "./pages/Orders";
import OrderDetails from "./pages/OrderDetails";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import DeliveryDashboard from "./pages/DeliveryDashboard";
import NewOrders from "./pages/NewOrders";
import RestaurantBranch from "./pages/RestaurantBranch";
import Checkout from "./pages/Checkout";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailed from "./pages/PaymentFailed";
import CreateRestaurant from "./pages/CreateRestaurant";
import ChangePassword from "./pages/ChangePassword";
import AccountDeactivated from "./pages/AccountDeactivated";
import ProtectedRoute from "./components/ProtectedRoute";
import PaymentMethodsManagement from "./components/admin/PaymentMethodsManagement";
// Import admin components
import DashboardHome from "./components/admin/DashboardHome";
import AdminDeliveryEarnings from "./components/admin/AdminDeliveryEarnings";
import AllOrders from "./components/admin/AllOrders";
import CategoriesManagement from "./components/admin/CategoriesManagement";
import MenuItemsManagement from "./components/admin/MenuItemsManagement";
import CustomersManagement from "./components/admin/CustomersManagement";
import RestaurantsManagement from "./components/admin/RestaurantsManagement";
import DeliveryManagement from "./components/admin/DeliveryManagement";
import ManagersManagement from "./components/admin/ManagersManagement";
import GraphsSection from "./components/admin/GraphsSection";
// Import delivery components
import DeliveryDashboardHome from "./components/delivery/DeliveryDashboardHome";
import DeliveryLiveOrders from "./components/delivery/DeliveryLiveOrders";
import DeliveryAssignedOrders from "./components/delivery/DeliveryAssignedOrders";
import DeliveryOnTheWayOrders from "./components/delivery/DeliveryOnTheWayOrders";
import DeliveryAllOrders from "./components/delivery/DeliveryAllOrders";
import DeliveryEarnings from "./components/delivery/DeliveryEarnings";
import ManagerDashboard from "./pages/ManagerDashboard";
import ManagerDashboardHome from "./components/manager/ManagerDashboardHome";
import ManagerCategories from "./components/manager/ManagerCategories";
import BranchesManagement from "./components/manager/BranchesManagement";
import ManagerMenus from "./components/manager/ManagerMenus";
import ManagerAllOrders from "./components/manager/ManagerAllOrders";
import BranchManagerDashboard from "./pages/BranchManagerDashboard";
import MyRestaurant from "./components/manager/MyRestaurant";
import BranchManagerDashboardHome from "./components/branch-manager/BranchManagerDashboardHome";
import BranchManagerMenus from "./components/branch-manager/BranchManagerMenus";
import BranchDetails from "./components/branch-manager/BranchDetails";
import BranchPaymentSettings from "./components/branch-manager/BranchPaymentSettings";
import BranchManagerAllOrders from "./components/branch-manager/BranchManagerAllOrders";
import BranchManagerIncomingOrders from "./components/branch-manager/BranchManagerIncomingOrders";
import BranchManagerPreparationQueue from "./components/branch-manager/BranchManagerPreparationQueue";
import BranchManagerDispatchBoard from "./components/branch-manager/BranchManagerDispatchBoard";
import BranchManagerAllPayments from "./components/branch-manager/BranchManagerAllPayments";
import BranchManagerRefunds from "./components/branch-manager/BranchManagerRefunds";
import BranchManagersManagement from "./components/manager/BranchManagersManagement";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on 403 Forbidden
        if (error?.response?.status === 403) return false;
        // Default to 1 retry for other errors
        return failureCount < 1;
      },
      refetchOnWindowFocus: false, // Optional: prevent refetch on window focus
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <ToastProvider>
              <CartToastProvider>
                <Router>
                  <div className="min-h-screen bg-background text-foreground">
                    <Routes>
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                      <Route path="/change-password" element={<ChangePassword />} />
                      <Route path="/account-deactivated" element={<AccountDeactivated />} />
                      <Route
                        path="admin"
                        element={
                          <ProtectedRoute requireAdmin>
                            <AdminDashboard />
                          </ProtectedRoute>
                        }
                      >
                        <Route
                          index
                          element={<Navigate to="dashboard" replace />}
                        />
                        <Route path="dashboard" element={<DashboardHome />} />
                        <Route
                          path="live-orders"
                          element={<Navigate to="/admin/all-orders" replace />}
                        />
                        <Route path="all-orders" element={<AllOrders />} />
                        <Route
                          path="categories"
                          element={<CategoriesManagement />}
                        />
                        <Route
                          path="customers"
                          element={<CustomersManagement />}
                        />
                        <Route
                          path="delivery"
                          element={<DeliveryManagement />}
                        />
                        <Route
                          path="managers"
                          element={<ManagersManagement />}
                        />
                        <Route
                          path="restaurants"
                          element={<RestaurantsManagement />}
                        />
                        <Route path="graphs" element={<GraphsSection />} />
                        <Route
                          path="payment-methods"
                          element={<PaymentMethodsManagement />}
                        />
                        <Route
                          path="delivery-earnings"
                          element={<AdminDeliveryEarnings />}
                        />
                        <Route path="profile" element={<Profile />} />
                      </Route>
                      <Route
                        path="delivery-panel"
                        element={
                          <ProtectedRoute requireDelivery>
                            <DeliveryDashboard />
                          </ProtectedRoute>
                        }
                      >
                        <Route
                          index
                          element={<Navigate to="dashboard" replace />}
                        />
                        <Route
                          path="dashboard"
                          element={<DeliveryDashboardHome />}
                        />
                        <Route
                          path="live-orders"
                          element={<DeliveryLiveOrders />}
                        />
                        <Route
                          path="assigned-orders"
                          element={<DeliveryAssignedOrders />}
                        />
                        <Route
                          path="on-the-way-orders"
                          element={<DeliveryOnTheWayOrders />}
                        />
                        <Route
                          path="all-orders"
                          element={<DeliveryAllOrders />}
                        />
                        <Route
                          path="earnings"
                          element={<DeliveryEarnings />}
                        />
                        <Route path="profile" element={<Profile />} />
                      </Route>
                      <Route
                        path="manager"
                        element={
                          <ProtectedRoute requireManager>
                            <ManagerDashboard />
                          </ProtectedRoute>
                        }
                      >
                        <Route
                          index
                          element={<Navigate to="dashboard" replace />}
                        />
                        <Route path="dashboard" element={<ManagerDashboardHome />} />
                        <Route path="my-restaurant" element={<MyRestaurant />} />
                        <Route path="categories" element={<ManagerCategories />} />
                        <Route path="menus" element={<ManagerMenus />} />
                        <Route
                          path="branches"
                          element={<BranchesManagement />}
                        />
                        <Route
                          path="branch-managers"
                          element={<BranchManagersManagement />}
                        />
                        <Route path="all-orders" element={<ManagerAllOrders />} />
                        <Route path="profile" element={<Profile />} />
                      </Route>
                      <Route
                        path="/create-restaurant"
                        element={
                          <ProtectedRoute requireManager>
                            <CreateRestaurant />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="branch-manager"
                        element={
                          <ProtectedRoute requireBranchManager>
                            <BranchManagerDashboard />
                          </ProtectedRoute>
                        }
                      >
                        <Route
                          index
                          element={<Navigate to="dashboard" replace />}
                        />
                        <Route path="dashboard" element={<BranchManagerDashboardHome />} />
                        <Route path="menus" element={<BranchManagerMenus />} />
                        <Route path="details" element={<BranchDetails />} />
                        <Route
                          path="payment-settings"
                          element={<BranchPaymentSettings />}
                        />
                        <Route path="incoming-orders" element={<BranchManagerIncomingOrders />} />
                        <Route path="preparation-queue" element={<BranchManagerPreparationQueue />} />
                        <Route path="dispatch-board" element={<BranchManagerDispatchBoard />} />
                        <Route path="all-orders" element={<BranchManagerAllOrders />} />
                        <Route path="all-payments" element={<BranchManagerAllPayments />} />
                        <Route path="refunds" element={<BranchManagerRefunds />} />
                        <Route path="profile" element={<Profile />} />
                      </Route>
                      <Route
                        path="/"
                        element={
                          <ProtectedRoute>
                            <Layout />
                          </ProtectedRoute>
                        }
                      >
                        <Route index element={<Home />} />
                        <Route
                          path="discovery"
                          element={
                            <ProtectedRoute requireLocation>
                              <Menu />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="restaurant-branch/:id"
                          element={
                            <ProtectedRoute requireLocation>
                              <RestaurantBranch />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="checkout/:branchId"
                          element={
                            <ProtectedRoute requireAuth requireLocation>
                              <Checkout />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="paymentStatus/paymentSuccess"
                          element={
                            <ProtectedRoute requireAuth>
                              <PaymentSuccess />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="paymentStatus/paymentFailed"
                          element={
                            <ProtectedRoute requireAuth>
                              <PaymentFailed />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="orders"
                          element={
                            <ProtectedRoute requireAuth>
                              <Orders />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="orders/:id"
                          element={
                            <ProtectedRoute requireAuth>
                              <OrderDetails />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="profile"
                          element={
                            <ProtectedRoute requireAuth>
                              <Profile />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="new-orders"
                          element={
                            <ProtectedRoute requireAdmin>
                              <NewOrders />
                            </ProtectedRoute>
                          }
                        />
                      </Route>
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </div>
                </Router>
              </CartToastProvider>
            </ToastProvider>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>

      {/* React Toastify Container */}
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss={false}
        draggable={false}
        pauseOnHover={false}
        theme="colored"
        limit={1}
        enableMultiContainer={false}
        closeButton={false}
        toastStyle={{
          fontSize: "12px",
          borderRadius: "6px",
          padding: "8px 12px",
          marginBottom: "8px",
        }}
        // Custom colors for each toast type
        style={{
          "--toastify-color-success": "#10b981", // Green-500
          "--toastify-color-error": "#ef4444", // Red-500
          "--toastify-color-warning": "#f59e0b", // Amber-500
          "--toastify-color-info": "#3b82f6", // Blue-500
        }}
      />
    </QueryClientProvider>
  );
}

export default App;
