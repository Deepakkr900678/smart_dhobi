import React, { useState, useEffect, useMemo } from "react";
import {
  Search, Package, Truck, ShoppingBag, CheckCircle,
  AlertTriangle, X, Eye, ChevronLeft, ChevronRight,
  Filter, ChevronDown, RefreshCw,
} from "lucide-react";
import { getOrderManagment } from "../../auth/ApiConnect";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (d) =>
  d ? new Date(d).toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }) : "—";

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  }) : "—";

// ─── Badges ───────────────────────────────────────────────────────────────────

const STATUS_STYLES = {
  pending:     "bg-yellow-100 text-yellow-800",
  accepted:    "bg-blue-100   text-blue-800",
  in_progress: "bg-indigo-100 text-indigo-800",
  ready:       "bg-cyan-100   text-cyan-800",
  delivered:   "bg-green-100  text-green-800",
  cancelled:   "bg-red-100    text-red-800",
};

const PAYMENT_STYLES = {
  pending:   "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100  text-green-800",
  failed:    "bg-red-100    text-red-800",
  refunded:  "bg-purple-100 text-purple-800",
};

const StatusBadge  = ({ s }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[s]  || "bg-gray-100 text-gray-700"}`}>
    {s?.replace("_", " ") || "—"}
  </span>
);
const PaymentBadge = ({ s }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${PAYMENT_STYLES[s] || "bg-gray-100 text-gray-700"}`}>
    {s || "—"}
  </span>
);

// ─── Stat Card ────────────────────────────────────────────────────────────────

const StatCard = ({ title, value, sub, color, Icon }) => (
  <div className={`bg-white rounded-xl shadow-sm border-l-4 border-${color}-500 p-5`}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p>
        <p className="text-3xl font-bold text-gray-800 mt-1">{value ?? "—"}</p>
        <p className="text-xs text-gray-400 mt-1">{sub}</p>
      </div>
      <div className={`bg-${color}-100 p-2.5 rounded-lg`}>
        <Icon className={`h-5 w-5 text-${color}-600`} />
      </div>
    </div>
  </div>
);

// ─── Pagination ───────────────────────────────────────────────────────────────

const Pagination = ({ pagination, onChange }) => {
  const { page, totalPages, total, limit, hasNextPage, hasPrevPage } = pagination;
  const from = (page - 1) * limit + 1;
  const to   = Math.min(page * limit, total);

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
    .reduce((acc, p, i, arr) => {
      if (i > 0 && p - arr[i - 1] > 1) acc.push("…");
      acc.push(p);
      return acc;
    }, []);

  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
      <p className="text-sm text-gray-500">
        Showing <span className="font-medium text-gray-700">{from}–{to}</span> of{" "}
        <span className="font-medium text-gray-700">{total}</span> orders
      </p>
      <div className="flex items-center gap-1">
        <button onClick={() => onChange(page - 1)} disabled={!hasPrevPage}
          className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`el-${i}`} className="px-1 text-gray-400 text-sm">…</span>
          ) : (
            <button key={p} onClick={() => onChange(p)}
              className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                p === page ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}>
              {p}
            </button>
          )
        )}
        <button onClick={() => onChange(page + 1)} disabled={!hasNextPage}
          className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

// ─── Detail Modal ─────────────────────────────────────────────────────────────

const OrderDetailModal = ({ order, onClose }) => {
  if (!order) return null;
  const customer = order.userId;
  const provider = order.providerId;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-semibold text-gray-900">
              Order <span className="font-mono text-indigo-600 text-sm">#{order.orderId}</span>
            </h3>
            <StatusBadge s={order.status} />
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6 space-y-5">

          {/* Key info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-gray-50 rounded-xl p-4">
            {[
              { label: "Order date",  val: fmtDate(order.createdAt) },
              { label: "Amount",      val: `₹${order.amount}` },
              { label: "Payment",     val: <PaymentBadge s={order.paymentStatus} /> },
              { label: "Pickup time", val: fmt(order.pickupTime) },
            ].map(({ label, val }) => (
              <div key={label}>
                <p className="text-xs text-gray-500 mb-1">{label}</p>
                <div className="text-sm font-medium text-gray-800">{val}</div>
              </div>
            ))}
          </div>

          {/* Razorpay info if paid */}
          {order.razorpayPaymentId && (
            <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-sm">
              <p className="font-semibold text-green-800 mb-2">Payment Details</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-green-700">
                <p><span className="text-gray-500">Razorpay Order: </span>{order.razorpayOrderId}</p>
                <p><span className="text-gray-500">Payment ID: </span>{order.razorpayPaymentId}</p>
                {order.paidAt && <p><span className="text-gray-500">Paid at: </span>{fmt(order.paidAt)}</p>}
              </div>
            </div>
          )}

          {/* Customer + Dhobi */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-100 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Customer</h4>
              {customer ? (
                <div className="space-y-1.5 text-sm">
                  <p><span className="text-gray-500">Name: </span>{customer.name}</p>
                  <p><span className="text-gray-500">Email: </span>{customer.email}</p>
                  <p><span className="text-gray-500">Mobile: </span>{customer.mobile}</p>
                  <p className="text-xs text-gray-500 mt-2">Pickup address</p>
                  <p className="text-xs text-gray-700">{order.pickupAddress}</p>
                  <p className="text-xs text-gray-500 mt-1">Delivery address</p>
                  <p className="text-xs text-gray-700">{order.deliveryAddress}</p>
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">Customer account deleted</p>
              )}
            </div>
            <div className="border border-gray-100 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Dhobi</h4>
              {provider ? (
                <div className="space-y-1.5 text-sm">
                  <p><span className="text-gray-500">Name: </span>{provider.name}</p>
                  <p><span className="text-gray-500">Email: </span>{provider.email}</p>
                  <p><span className="text-gray-500">Mobile: </span>{provider.mobile}</p>
                  <p className="text-xs text-gray-500 mt-2">Address</p>
                  <p className="text-xs text-gray-700">{provider.address}</p>
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">Provider not found</p>
              )}
            </div>
          </div>

          {/* Services table */}
          {order.services?.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Services</h4>
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>
                      {["Service", "Qty", "Unit price", "Total"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {order.services.map((s, i) => (
                      <tr key={s._id || i}>
                        <td className="px-4 py-3 text-sm text-gray-800 capitalize">{s.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{s.quantity}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">₹{s.price}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-800">₹{s.price * s.quantity}</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50">
                      <td colSpan="3" className="px-4 py-3 text-sm font-semibold text-gray-700 text-right">Total</td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-900">₹{order.amount}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
          <button onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const DEFAULT_PAGINATION = { total: 0, page: 1, limit: 20, totalPages: 1, hasNextPage: false, hasPrevPage: false };

const OrderManagement = () => {
  const [orders,      setOrders]      = useState([]);
  const [pagination,  setPagination]  = useState(DEFAULT_PAGINATION);
  const [summary,     setSummary]     = useState({});
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [search,      setSearch]      = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy,      setSortBy]      = useState("newest");
  const [page,        setPage]        = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = async (p = 1) => {
    setLoading(true);
    setError(null);
    try {
      // Pass page param — update getOrderManagment in ApiConnect to accept page if needed
      const res = await getOrderManagment(p);

      // API returns { success, data: [...], pagination: {...} }
      if (res?.data) {
        setOrders(res.data);
        setPagination(res.pagination || DEFAULT_PAGINATION);

        // Build summary from returned data (or use res.summary if your API provides it)
        const all = res.data;
        setSummary({
          totalOrders:     res.pagination?.total ?? all.length,
          pendingOrders:   all.filter((o) => ["pending", "accepted", "in_progress", "ready"].includes(o.status)).length,
          completedOrders: all.filter((o) => o.status === "delivered").length,
          cancelledOrders: all.filter((o) => o.status === "cancelled").length,
        });
      } else {
        setError("Failed to load orders.");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to load orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(page); }, [page]);

  // ── Client-side filter + sort on current page data ─────────────────────────
  const filtered = useMemo(() => {
    let list = orders.filter((o) => {
      const q        = search.toLowerCase();
      const customer = o.userId;
      const provider = o.providerId;
      const matchSearch =
        !q ||
        o.orderId?.toLowerCase().includes(q) ||
        customer?.name?.toLowerCase().includes(q) ||
        customer?.email?.toLowerCase().includes(q) ||
        customer?.mobile?.includes(q) ||
        provider?.name?.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || o.status === statusFilter;
      return matchSearch && matchStatus;
    });

    list.sort((a, b) => {
      if (sortBy === "newest")  return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === "oldest")  return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === "highest") return b.amount - a.amount;
      if (sortBy === "lowest")  return a.amount - b.amount;
      return 0;
    });
    return list;
  }, [orders, search, statusFilter, sortBy]);

  const handlePageChange = (p) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
            <p className="text-sm text-gray-500 mt-0.5">Track and manage all platform orders</p>
          </div>
          <button onClick={() => fetchOrders(page)}
            className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 bg-white border border-gray-200 px-3 py-2 rounded-lg shadow-sm">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Total Orders"   value={summary.totalOrders}     sub="All time"           color="indigo" Icon={ShoppingBag} />
          <StatCard title="In Progress"    value={summary.pendingOrders}   sub="Active orders"      color="amber"  Icon={Truck} />
          <StatCard title="Delivered"      value={summary.completedOrders} sub="Successfully done"  color="green"  Icon={CheckCircle} />
          <StatCard title="Cancelled"      value={summary.cancelledOrders} sub="This page"          color="red"    Icon={AlertTriangle} />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by order ID, customer name, or dhobi..."
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-9 pr-8 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50 appearance-none">
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="in_progress">In Progress</option>
                <option value="ready">Ready</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            <div className="relative">
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                className="pl-3 pr-8 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50 appearance-none">
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest">Highest Amount</option>
                <option value="lowest">Lowest Amount</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto" />
            <p className="mt-4 text-sm text-gray-500">Loading orders...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center">
            <AlertTriangle className="h-10 w-10 text-red-400 mx-auto mb-2" />
            <p className="text-sm text-red-500 mb-3">{error}</p>
            <button onClick={() => fetchOrders(page)} className="text-sm text-indigo-600 underline">Try again</button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    {["Order ID", "Customer", "Dhobi", "Services", "Amount", "Status", "Payment", "Date", ""].map((h) => (
                      <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.length > 0 ? (
                    filtered.map((order) => {
                      const customer = order.userId;
                      const provider = order.providerId;
                      return (
                        <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-4 text-xs font-mono text-indigo-600 whitespace-nowrap">
                            {order.orderId}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            {customer ? (
                              <>
                                <div className="text-sm font-medium text-gray-800">{customer.name}</div>
                                <div className="text-xs text-gray-400">{customer.mobile}</div>
                              </>
                            ) : (
                              <span className="text-xs text-gray-400 italic">Deleted account</span>
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-700">{provider?.name || "—"}</div>
                            <div className="text-xs text-gray-400">{provider?.mobile || ""}</div>
                          </td>
                          <td className="px-4 py-4 max-w-[160px]">
                            <div className="text-xs text-gray-600 truncate">
                              {order.services?.map((s) => `${s.name} ×${s.quantity}`).join(", ") || "—"}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-gray-800">₹{order.amount}</div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <StatusBadge s={order.status} />
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <PaymentBadge s={order.paymentStatus} />
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-500">
                            {fmtDate(order.createdAt)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-right">
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="9" className="px-4 py-12 text-center">
                        <Package className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm font-medium text-gray-600">No orders found</p>
                        <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filters</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Server-side pagination */}
            <Pagination pagination={pagination} onChange={handlePageChange} />
          </div>
        )}
      </div>

      {selectedOrder && (
        <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  );
};

export default OrderManagement;
