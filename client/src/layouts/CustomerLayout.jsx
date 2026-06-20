import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, Users, ShoppingBag, User, DollarSign, 
  BarChart2, LogOut, Menu, X, Bell, Settings 
} from 'lucide-react';
import NavbarInside from '../components/NavbarInside';
import SideBar from '../components/SideBar';

const CustomerLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };
  
  const navItems = [
    { path: '/customer', label: 'Dashboard', icon: <Home size={20} /> },
    { path: '/customer/orders', label: 'My Orders', icon: <ShoppingBag size={20} /> },
    { path: '/customer/profile', label: 'Profile', icon: <User size={20} /> },
    // { path: '/customer/settings', label: 'Settings', icon: <Settings size={20} /> },
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

export default CustomerLayout;
