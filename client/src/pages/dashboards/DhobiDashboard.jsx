import React, { useEffect, useState } from "react";
import {
  Home,
  Package,
  Users,
  Settings,
  Star,
  TrendingUp,
  Calendar,
  DollarSign,
} from "lucide-react";

import StatsCard from "../../components/basicComponent/StatsCard";
import RecentOrdersTable from "../../components/dhobiComponent/RecentOrdersTable";
import ProfileSummary from "../../components/dhobiComponent/ProfileSummary";
import ServicesSection from "../../components/dhobiComponent/ServiceSection";
import { fetchDhobiById } from "../../auth/ApiConnect";

function DhobiDashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    monthlyRevenue: 0,
    rating: 0,
    activeServices: 0,
  });

  const [recentOrders] = useState([
    // {
    //   id: "ORD001",
    //   customerName: "Rahul Sharma",
    //   customerPhone: "+91 7558618689",
    //   service: "Wash & Fold",
    //   amount: 120,
    //   status: "pending",
    //   date: "2025-05-25",
    // },
    // {
    //   id: "ORD002",
    //   customerName: "Priya Singh",
    //   customerPhone: "+91 8765432109",
    //   service: "Dry Cleaning",
    //   amount: 200,
    //   status: "in-progress",
    //   date: "2025-05-24",
    // },
    // {
    //   id: "ORD003",
    //   customerName: "Amit Kumar",
    //   customerPhone: "+91 7654321098",
    //   service: "Express Wash",
    //   amount: 150,
    //   status: "completed",
    //   date: "2025-05-24",
    // },
    // {
    //   id: "ORD004",
    //   customerName: "Sneha Patel",
    //   customerPhone: "+91 6543210987",
    //   service: "Ironing",
    //   amount: 80,
    //   status: "completed",
    //   date: "2025-05-23",
    // },
  ]);

  const [services, setServices] = useState([]);

  const [profile, setProfile] = useState({
    name: "",
    owner: "",
    phone: "",
    address: "",
    rating: 0,
    totalReviews: 0,
    isActive: true,
    commissionRate: 0,
  });

  //change this to provider data i am getting this from user
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      setProfile((prev) => ({
        ...prev,
        name: user.name || prev.name,
        owner: user.name || prev.owner,
        phone: user.mobile || prev.phone,
        address: user.serviceAreas || prev.address,
        rating: user.rating || prev.rating,
        totalReviews: user.totalReviews || prev.totalReviews,
        isActive: user.isActive !== undefined ? user.isActive : prev.isActive,
        commissionRate: user.commissionRate || prev.commissionRate,
      }));
    }
  }, []);

  const fetchServices = async () => {
    try {
      const dhobiId = localStorage.getItem("mainUserId");
      if (!dhobiId) {
        console.error("Dhobi ID not found in localStorage");
        setServices([]);
        return;
      }
      // Fetch services for the dhobi using the dhobiId
      const response = await fetchDhobiById(dhobiId);
      if (response) {
        setServices(response.services || []);
      } else {
        console.error("No services found or response is empty");
        setServices([]);
      }
    } catch (error) {
      console.error("Error fetching services:", error);
      setServices([]);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleEditService = (service) => {
    console.log("Edit service:", service);
    // Implement edit functionality
  };

  const handleDeleteService = (serviceId) => {
    console.log("Delete service:", serviceId);
    // Implement delete functionality
  };

  const dashboardStats = [
    {
      title: "Total Orders",
      value: stats.totalOrders.toString(),
      subtitle: `${stats.pendingOrders} pending`,
      icon: <Package size={24} />,
      color: "blue",
      trend: { positive: true, value: 12 },
    },
    {
      title: "Monthly Revenue",
      value: `₹${stats.monthlyRevenue.toLocaleString()}`,
      subtitle: "This month",
      icon: <DollarSign size={24} />,
      color: "green",
      trend: { positive: true, value: 8 },
    },
    {
      title: "Average Rating",
      value: stats.rating.toString(),
      subtitle: "Based on customer reviews",
      icon: <Star size={24} />,
      color: "orange",
      trend: { positive: true, value: 2 },
    },
    {
      title: "Active Services",
      value: stats.activeServices.toString(),
      subtitle: "Available for booking",
      icon: <Settings size={24} />,
      color: "purple",
    },
  ];

  console.log(services, "services in dhobi dashboard");

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dhobi Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Manage your laundry business and track performance
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardStats.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Recent Orders (2/3 width) */}
        {/* <div className="lg:col-span-2">
            <RecentOrdersTable orders={recentOrders} />
          </div> */}

        {/* Right Column - Profile Summary (1/3 width) */}
        <div>
          <ProfileSummary profile={profile} />
        </div>
        <ServicesSection
          services={services}
          onEditService={handleEditService}
          onDeleteService={handleDeleteService}
          onServiceChange={fetchServices}
        />
      </div>
    </div>
  );
}

// Navigation items for DhobiLayout
export const dhobiNavItems = [
  { path: "/dhobi", label: "Dashboard", icon: <Home size={20} /> },
  { path: "/dhobi/orders", label: "Orders", icon: <Package size={20} /> },
  { path: "/dhobi/services", label: "Services", icon: <Settings size={20} /> },
  { path: "/dhobi/customers", label: "Customers", icon: <Users size={20} /> },
  {
    path: "/dhobi/analytics",
    label: "Analytics",
    icon: <TrendingUp size={20} />,
  },
  { path: "/dhobi/profile", label: "Profile", icon: <Settings size={20} /> },
];

export default DhobiDashboard;
