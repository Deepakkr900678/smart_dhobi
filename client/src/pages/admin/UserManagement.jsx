import React, { useState, useEffect } from "react";
import {
  Search,
  Users,
  AlertCircle,
  Check,
  Phone,
  Mail,
  Calendar,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Filter,
  ChevronDown,
} from "lucide-react";
import { getAllUsers } from "../../auth/ApiConnect";
import UserAvatar from "../../components/basicComponent/UserAvatar";
import UserDetailModal from "./usercomponent/UserDetailModal";

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ isVerified }) =>
  isVerified ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
      <Check className="h-3 w-3" />
      Verified
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
      Not Verified
    </span>
  );

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ title, value, sub, colorClass, Icon }) => (
  <div className={`bg-white rounded-xl shadow-sm p-5 border-l-4 ${colorClass}`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          {title}
        </p>
        <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
        <p className="text-xs text-gray-400 mt-1">{sub}</p>
      </div>
      <div className={`p-3 rounded-full bg-gray-50`}>
        <Icon className="h-6 w-6 text-gray-400" />
      </div>
    </div>
  </div>
);

// ─── Table Row ────────────────────────────────────────────────────────────────
const UserTableRow = ({ user, onViewDetails }) => (
  <tr className="hover:bg-gray-50 transition-colors">
    <td className="px-5 py-4 whitespace-nowrap">
      <div className="flex items-center gap-3">
        <UserAvatar name={user.name} />
        <div>
          <div className="text-sm font-semibold text-gray-900">{user.name}</div>
          <div className="text-xs text-gray-400 capitalize">{user.role}</div>
        </div>
      </div>
    </td>
    <td className="px-5 py-4 whitespace-nowrap">
      <div className="flex items-center gap-1.5 text-sm text-gray-700">
        <Mail className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
        {user.email}
      </div>
      <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
        <Phone className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
        {user.mobile || "—"}
      </div>
    </td>
    <td className="px-5 py-4 whitespace-nowrap">
      <div className="flex items-center gap-1.5 text-sm text-gray-600">
        <Calendar className="h-3.5 w-3.5 text-gray-400" />
        {new Date(user.createdAt).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </div>
    </td>
    <td className="px-5 py-4 whitespace-nowrap">
      <StatusBadge isVerified={user.isVerified} />
    </td>
    <td className="px-5 py-4 whitespace-nowrap text-center">
      <div className="inline-flex items-center gap-1 text-sm font-medium text-gray-700">
        <ShoppingBag className="h-3.5 w-3.5 text-gray-400" />
        {user.orders ?? 0}
      </div>
    </td>
    <td className="px-5 py-4 whitespace-nowrap text-right">
      <button
        onClick={() => onViewDetails(user)}
        className="text-xs font-medium text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
      >
        View Details
      </button>
    </td>
  </tr>
);

// ─── Pagination ───────────────────────────────────────────────────────────────
const Pagination = ({
  currentPage,
  totalPages,
  total,
  perPage,
  onPageChange,
}) => {
  const from = (currentPage - 1) * perPage + 1;
  const to = Math.min(currentPage * perPage, total);
  return (
    <div className="bg-white px-5 py-3 border-t border-gray-100 flex items-center justify-between rounded-b-xl">
      <p className="text-sm text-gray-500">
        Showing{" "}
        <span className="font-medium text-gray-700">
          {from}–{to}
        </span>{" "}
        of <span className="font-medium text-gray-700">{total}</span> users
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter(
            (p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1
          )
          .reduce((acc, p, idx, arr) => {
            if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
            acc.push(p);
            return acc;
          }, [])
          .map((p, i) =>
            p === "..." ? (
              <span
                key={`ellipsis-${i}`}
                className="px-2 text-gray-400 text-sm"
              >
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                  p === currentPage
                    ? "bg-indigo-600 text-white"
                    : "text-gray-600 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                {p}
              </button>
            )
          )}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const PER_PAGE = 10;

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await getAllUsers();
      setUsers(response.data || []);
    } catch (err) {
      console.error("Error fetching users:", err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sortBy]);

  // ── Filter + sort ──────────────────────────────────────────────────────────
  const filtered = React.useMemo(() => {
    let list = users.filter((u) => {
      if (u.role !== "user") return false;
      const q = searchTerm.toLowerCase();
      const matchSearch =
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.mobile?.includes(q);
      const matchStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "verified"
          ? u.isVerified === true
          : statusFilter === "unverified"
          ? u.isVerified === false
          : statusFilter === "suspended"
          ? u.status === "suspended"
          : true;
      return matchSearch && matchStatus;
    });

    list.sort((a, b) => {
      if (sortBy === "newest")
        return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === "oldest")
        return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === "name-asc") return a.name.localeCompare(b.name);
      if (sortBy === "name-desc") return b.name.localeCompare(a.name);
      return 0;
    });
    return list;
  }, [users, searchTerm, statusFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const currentUsers = filtered.slice(
    (currentPage - 1) * PER_PAGE,
    currentPage * PER_PAGE
  );

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = React.useMemo(() => {
    const base = users.filter((u) => u.role === "user");
    return {
      total: base.length,
      verified: base.filter((u) => u.isVerified).length,
      suspended: base.filter((u) => u.status === "suspended").length,
    };
  }, [users]);

  const handleStatusChange = (userId, newStatus) => {
    setUsers((prev) =>
      prev.map((u) => (u._id === userId ? { ...u, status: newStatus } : u))
    );
    if (selectedUser?._id === userId) {
      setSelectedUser((prev) => ({ ...prev, status: newStatus }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              User Management
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Manage and monitor all registered users
            </p>
          </div>
          <button
            onClick={fetchUsers}
            className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 bg-white border border-gray-200 px-3 py-2 rounded-lg shadow-sm"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="Total Users"
            value={stats.total}
            sub="All registered users"
            colorClass="border-l-indigo-500"
            Icon={Users}
          />
          <StatCard
            title="Verified Users"
            value={stats.verified}
            sub="Mobile/email verified"
            colorClass="border-l-green-500"
            Icon={Check}
          />
          <StatCard
            title="Suspended Users"
            value={stats.suspended}
            sub="Access restricted"
            colorClass="border-l-red-500"
            Icon={AlertCircle}
          />
        </div>

        {/* Search + Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, email or mobile..."
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-gray-50"
              />
            </div>

            {/* Status filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-9 pr-8 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50 appearance-none"
              >
                <option value="all">All Status</option>
                <option value="verified">Verified</option>
                <option value="unverified">Not Verified</option>
                <option value="suspended">Suspended</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>

            {/* Sort */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="pl-3 pr-8 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50 appearance-none"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name-asc">Name A–Z</option>
                <option value="name-desc">Name Z–A</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto" />
            <p className="mt-4 text-sm text-gray-500">Loading users...</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead>
                  <tr className="bg-gray-50">
                    {["User", "Contact", "Joined", "Status", "Orders", ""].map(
                      (h) => (
                        <th
                          key={h}
                          className={`px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide ${
                            h === "" ? "text-right" : ""
                          }`}
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentUsers.length > 0 ? (
                    currentUsers.map((user) => (
                      <UserTableRow
                        key={user._id}
                        user={user}
                        onViewDetails={(u) => {
                          setSelectedUser(u);
                          setIsModalOpen(true);
                        }}
                        onStatusChange={handleStatusChange}
                      />
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-5 py-12 text-center">
                        <Users className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm font-medium text-gray-600">
                          No users found
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Try adjusting your search or filters
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                total={filtered.length}
                perPage={PER_PAGE}
                onPageChange={setCurrentPage}
              />
            )}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <UserDetailModal
        user={selectedUser}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedUser(null);
        }}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
};

export default UserManagement;
