import React, { useEffect, useState } from "react";
import {
  Users,
  Store,
  ShoppingBag,
  IndianRupee,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { getAdminDashboardData } from "../../auth/ApiConnect";
import { useNavigate } from "react-router-dom";

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ title, value, sub, Icon, color, onClick }) => (
  <div
    onClick={onClick}
    className={`bg-white rounded-xl shadow-sm border border-gray-100 p-5 cursor-pointer
      hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border-l-4 border-l-${color}-500`}
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          {title}
        </p>
        <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
      <div className={`bg-${color}-50 p-3 rounded-xl`}>
        <Icon className={`h-6 w-6 text-${color}-500`} />
      </div>
    </div>
  </div>
);

// ─── Order status breakdown bar ───────────────────────────────────────────────
const StatusBar = ({ breakdown, total }) => {
  const statuses = [
    { key: "delivered", label: "Delivered", color: "bg-green-500" },
    { key: "pending", label: "Pending", color: "bg-yellow-400" },
    { key: "accepted", label: "Accepted", color: "bg-blue-500" },
    { key: "cancelled", label: "Cancelled", color: "bg-red-400" },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">
        Order status breakdown
      </h3>

      {/* Stacked bar */}
      <div className="flex h-3 rounded-full overflow-hidden mb-5 bg-gray-100">
        {statuses.map(({ key, color }) => {
          const count = breakdown[key] || 0;
          const pct = total > 0 ? (count / total) * 100 : 0;
          return pct > 0 ? (
            <div
              key={key}
              className={`${color} transition-all`}
              style={{ width: `${pct}%` }}
            />
          ) : null;
        })}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statuses.map(({ key, label, color }) => {
          const count = breakdown[key] || 0;
          const pct = total > 0 ? ((count / total) * 100).toFixed(0) : 0;
          return (
            <div key={key} className="flex items-center gap-2">
              <span
                className={`inline-block w-2.5 h-2.5 rounded-full ${color} flex-shrink-0`}
              />
              <div>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-sm font-semibold text-gray-800">
                  {count}{" "}
                  <span className="text-xs font-normal text-gray-400">
                    ({pct}%)
                  </span>
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Provider breakdown ───────────────────────────────────────────────────────
const ProviderBar = ({ active, pending, total }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
    <h3 className="text-sm font-semibold text-gray-700 mb-4">
      Provider status
    </h3>
    <div className="flex h-3 rounded-full overflow-hidden mb-5 bg-gray-100">
      {total > 0 && (
        <>
          <div
            className="bg-green-500 transition-all"
            style={{ width: `${(active / total) * 100}%` }}
          />
          <div
            className="bg-yellow-400 transition-all"
            style={{ width: `${(pending / total) * 100}%` }}
          />
        </>
      )}
    </div>
    <div className="grid grid-cols-3 gap-3">
      {[
        { label: "Total", value: total, color: "bg-indigo-500" },
        { label: "Active", value: active, color: "bg-green-500" },
        { label: "Pending", value: pending, color: "bg-yellow-400" },
      ].map(({ label, value, color }) => (
        <div key={label} className="flex items-center gap-2">
          <span
            className={`inline-block w-2.5 h-2.5 rounded-full ${color} flex-shrink-0`}
          />
          <div>
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-sm font-semibold text-gray-800">{value}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ─── Main ─────────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getAdminDashboardData();
        // API returns { success, data: { usersCount, ... } }
        setData(res?.data ?? res);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
          <p className="text-sm text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-2" />
          <p className="text-sm text-red-500">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 text-sm text-indigo-600 underline"
          >
            Retry
          </button>
        </div>
      </div>
    );

  const {
    usersCount = 0,
    providersCount = 0,
    pendingProvidersCount = 0,
    activeProvidersCount = 0,
    ordersCount = 0,
    totalEarnings = 0,
    orderStatusBreakdown = {},
  } = data || {};

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Platform overview at a glance
          </p>
        </div>

        {/* Top stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Users"
            value={usersCount}
            sub="Registered customers"
            Icon={Users}
            color="indigo"
            onClick={() => navigate("users")}
          />
          <StatCard
            title="Providers"
            value={providersCount}
            sub={`${activeProvidersCount} active · ${pendingProvidersCount} pending`}
            Icon={Store}
            color="teal"
            onClick={() => navigate("vendors")}
          />
          <StatCard
            title="Total Orders"
            value={ordersCount}
            sub="All time"
            Icon={ShoppingBag}
            color="amber"
            onClick={() => navigate("orders")}
          />
          <StatCard
            title="Total Earnings"
            value={`₹${Number(totalEarnings).toLocaleString("en-IN")}`}
            sub="Platform revenue"
            Icon={IndianRupee}
            color="green"
            onClick={() => navigate("revenue")}
          />
        </div>

        {/* Breakdown charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatusBar breakdown={orderStatusBreakdown} total={ordersCount} />
          <ProviderBar
            total={providersCount}
            active={activeProvidersCount}
            pending={pendingProvidersCount}
          />
        </div>

        {/* Quick action cards */}
        <div>
          <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
            Quick actions
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label: "View users",
                Icon: Users,
                path: "users",
                color: "indigo",
              },
              {
                label: "Manage dhobis",
                Icon: Store,
                path: "vendors",
                color: "teal",
              },
              {
                label: "View orders",
                Icon: ShoppingBag,
                path: "orders",
                color: "amber",
              },
              {
                label: "Revenue",
                Icon: TrendingUp,
                path: "revenue",
                color: "green",
              },
            ].map(({ label, Icon, path, color }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`flex items-center gap-2 px-4 py-3 bg-white border border-gray-100
                  rounded-xl shadow-sm hover:shadow-md hover:border-${color}-200
                  text-sm font-medium text-gray-700 hover:text-${color}-700
                  transition-all duration-150`}
              >
                <Icon className={`h-4 w-4 text-${color}-500`} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
