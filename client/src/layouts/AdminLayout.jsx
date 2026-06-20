import React, { useState } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  Users,
  ShoppingBag,
  User,
  DollarSign,
  BarChart2,
  LogOut,
  Menu,
  X,
  Bell,
  Settings,
} from "lucide-react";

import NavbarInside from "../components/NavbarInside";
import SideBar from "../components/SideBar";

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    navigate("/login");
  };

  const navItems = [
    { path: "/admin", label: "Dashboard", icon: <Home size={20} /> },
    {
      path: "/admin/vendors",
      label: "Dhobi Manage", 
      icon: <Users size={20} />,
    },
    {
      path: "/admin/users",
      label: "User Manage",
      icon: <User size={20} />,
    },
    {
      path: "/admin/orders",
      label: "Order Manage",
      icon: <ShoppingBag size={20} />,
    },
    {
      path: "/admin/profile",
      label: "Profile",
      icon: <User size={20} />,
    },
    // { path: '/admin/revenue', label: 'Revenue & Payments', icon: <DollarSign size={20} /> },
    // { path: '/admin/reports', label: 'Reports & Insights', icon: <BarChart2 sxize={20} /> },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar - Fixed position */}
      <SideBar
        isActive={isActive}
        navItems={navItems}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main content wrapper */}
      <div 
        className="transition-all duration-300 ease-in-out"
        style={{
          marginLeft: sidebarOpen ? "224px" : "64px"
        }}
      >
        {/* Top Header */}
        <NavbarInside />
        
        {/* Main content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
