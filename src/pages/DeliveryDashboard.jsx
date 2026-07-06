import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useLocation, Outlet, Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import ThemeToggle from "../components/ThemeToggle";
import SidebarUserProfile from "../components/common/SidebarUserProfile";
import {
  Home,
  RotateCcw,
  Package,
  LogOut,
  Menu as MenuIcon,
  X,
  Truck,
  Wallet,
} from "lucide-react";

const DeliveryDashboard = () => {
  const { logout } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = [
    {
      id: "dashboard",
      name: "Dashboard",
      icon: Home,
      path: "/delivery-panel/dashboard",
    },
    {
      id: "live-orders",
      name: "Unassigned Orders",
      icon: RotateCcw,
      path: "/delivery-panel/live-orders",
    },
    {
      id: "assigned-orders",
      name: "Ready for Pickup",
      icon: Package,
      path: "/delivery-panel/assigned-orders",
    },
    {
      id: "on-the-way-orders",
      name: "On the way",
      icon: Truck,
      path: "/delivery-panel/on-the-way-orders",
    },
    {
      id: "all-orders",
      name: "My Orders",
      icon: Package,
      path: "/delivery-panel/all-orders",
    },
    {
      id: "earnings",
      name: "Earnings",
      icon: Wallet,
      path: "/delivery-panel/earnings",
    },
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-background text-foreground w-full">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="bg-card"
        >
          {isMobileMenuOpen ? (
            <X className="h-4 w-4" />
          ) : (
            <MenuIcon className="h-4 w-4" />
          )}
        </Button>
      </div>

      <div className="flex w-full">
        {/* Sidebar */}
        <div
          className={`fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            } lg:static lg:inset-0 lg:fixed`}
        >
          <div className="flex flex-col h-screen overflow-hidden">
            {/* User Profile */}
            <SidebarUserProfile profilePath="/delivery-panel/profile" />

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-accent hover:text-accent-foreground"
                      }`}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* User section - Fixed at bottom */}
            <div className="flex-shrink-0 p-4 border-t border-border">
              <div className="flex items-center justify-between">
                <ThemeToggle />
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile overlay */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Main content - Account for fixed sidebar */}
        <div className="flex-1 w-full lg:ml-64">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default DeliveryDashboard;
