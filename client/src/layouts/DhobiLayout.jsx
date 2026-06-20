import React, { useState } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { Home, Package, Settings, Users, TrendingUp, User } from "lucide-react";
import NavbarInside from "../components/NavbarInside";
import SideBar from "../components/SideBar";

const DhobiLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    navigate("/login");
  };

  // Enhanced navigation items for dhobi functionality
  const navItems = [
    { path: "/dhobi", label: "Dashboard", icon: <Home size={20} /> },
    { path: "/dhobi/orders", label: "Orders", icon: <Package size={20} /> },
    { path: "/dhobi/profile", label: "Profile", icon: <User size={20} /> },
    // { path: "/dhobi/services", label: "Services", icon: <Settings size={20} /> },
    // { path: "/dhobi/customers", label: "Customers", icon: <Users size={20} /> },
    // { path: "/dhobi/analytics", label: "Analytics", icon: <TrendingUp size={20} /> },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="app-container flex min-h-screen">
      {/* Sidebar - Fixed position */}
      <SideBar
        isActive={isActive}
        navItems={navItems}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main content area - Responsive to sidebar width */}
      <div
        className="flex flex-col min-h-screen transition-all duration-300"
        style={{
          marginLeft: sidebarOpen ? "14rem" : "4rem",
          width: `calc(100% - ${sidebarOpen ? "14rem" : "4rem"})`,
        }}
      >
        {/* Top Header */}
        <NavbarInside />
        <main className="">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DhobiLayout;
