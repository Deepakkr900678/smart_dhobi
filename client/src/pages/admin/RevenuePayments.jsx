import React, { useState, useMemo } from "react";
import {
  DollarSign,
  Calendar,
  Download,
  FileText,
  CreditCard,
  Search,
  TrendingUp,
  CheckCircle,
  XCircle,
  Filter,
  ChevronDown,
  IndianRupee,
  Clock,
} from "lucide-react";

// ─── Mock data ────────────────────────────────────────────────────────────────

const TRANSACTIONS = [
  {
    id: "TXN-12345",
    vendor: "Laundry Express",
    amount: 2450,
    commission: 245,
    date: "2025-05-09",
    status: "completed",
  },
  {
    id: "TXN-12344",
    vendor: "Clean & Fold Co.",
    amount: 1890,
    commission: 189,
    date: "2025-05-09",
    status: "completed",
  },
  {
    id: "TXN-12343",
    vendor: "Wash Kings",
    amount: 3200,
    commission: 320,
    date: "2025-05-08",
    status: "completed",
  },
  {
    id: "TXN-12342",
    vendor: "Quick Press",
    amount: 1250,
    commission: 125,
    date: "2025-05-08",
    status: "pending",
  },
  {
    id: "TXN-12341",
    vendor: "Spotless Laundry",
    amount: 2800,
    commission: 280,
    date: "2025-05-07",
    status: "completed",
  },
  {
    id: "TXN-12340",
    vendor: "Fast Dry Cleaners",
    amount: 4500,
    commission: 450,
    date: "2025-05-07",
    status: "pending",
  },
  {
    id: "TXN-12339",
    vendor: "Urban Washers",
    amount: 1720,
    commission: 172,
    date: "2025-05-06",
    status: "completed",
  },
  {
    id: "TXN-12338",
    vendor: "Premium Laundry",
    amount: 3650,
    commission: 365,
    date: "2025-05-06",
    status: "failed",
  },
];

const PAYOUTS = [
  {
    id: "PAY-5678",
    vendor: "Laundry Express",
    amount: 8200,
    date: "2025-05-05",
    status: "completed",
  },
  {
    id: "PAY-5677",
    vendor: "Clean & Fold Co.",
    amount: 6500,
    date: "2025-05-05",
    status: "completed",
  },
  {
    id: "PAY-5676",
    vendor: "Wash Kings",
    amount: 7400,
    date: "2025-05-04",
    status: "completed",
  },
  {
    id: "PAY-5675",
    vendor: "Quick Press",
    amount: 4200,
    date: "2025-05-03",
    status: "pending",
  },
  {
    id: "PAY-5674",
    vendor: "Spotless Laundry",
    amount: 5900,
    date: "2025-05-02",
    status: "pending",
  },
  {
    id: "PAY-5673",
    vendor: "Fast Dry Cleaners",
    amount: 9100,
    date: "2025-05-01",
    status: "failed",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const inr = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

const STATUS_STYLES = {
  completed: "bg-green-100  text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  failed: "bg-red-100    text-red-800",
};
const STATUS_ICONS = {
  completed: <CheckCircle className="h-3 w-3" />,
  pending: <Clock className="h-3 w-3" />,
  failed: <XCircle className="h-3 w-3" />,
};

const StatusBadge = ({ status }) => (
  <span
    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
      STATUS_STYLES[status] || "bg-gray-100 text-gray-700"
    }`}
  >
    {STATUS_ICONS[status]}
    {status}
  </span>
);

// ─── Stat Card ────────────────────────────────────────────────────────────────

const StatCard = ({ title, value, sub, color, Icon }) => (
  <div
    className={`bg-white rounded-xl shadow-sm border-l-4 border-l-${color}-500 border border-gray-100 p-5`}
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          {title}
        </p>
        <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
        <p className="text-xs text-gray-400 mt-1">{sub}</p>
      </div>
      <div className={`bg-${color}-50 p-2.5 rounded-xl`}>
        <Icon className={`h-5 w-5 text-${color}-500`} />
      </div>
    </div>
  </div>
);

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const TABS = ["overview", "transactions", "payouts", "settings"];
const TAB_LABELS = {
  overview: "Overview",
  transactions: "Transactions",
  payouts: "Vendor Payouts",
  settings: "Commission Settings",
};

// ─── Filters bar ─────────────────────────────────────────────────────────────

const FiltersBar = ({
  search,
  setSearch,
  status,
  setStatus,
  dateRange,
  setDateRange,
}) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
    <div className="flex flex-col md:flex-row gap-3">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by vendor or ID..."
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50"
        />
      </div>
      {/* Status */}
      <div className="relative">
        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="pl-9 pr-8 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50 appearance-none"
        >
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      </div>
      {/* Date range */}
      <div className="flex items-center gap-2 text-sm">
        <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
        <input
          type="date"
          value={dateRange.start}
          onChange={(e) =>
            setDateRange((d) => ({ ...d, start: e.target.value }))
          }
          className="py-2 px-3 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none"
        />
        <span className="text-gray-400">–</span>
        <input
          type="date"
          value={dateRange.end}
          onChange={(e) => setDateRange((d) => ({ ...d, end: e.target.value }))}
          className="py-2 px-3 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none"
        />
      </div>
    </div>
  </div>
);

// ─── Transactions tab ─────────────────────────────────────────────────────────

const TransactionsTab = ({ search, statusFilter }) => {
  const filtered = useMemo(
    () =>
      TRANSACTIONS.filter((t) => {
        const q = search.toLowerCase();
        const matchSearch =
          t.id.toLowerCase().includes(q) || t.vendor.toLowerCase().includes(q);
        const matchStatus = statusFilter === "all" || t.status === statusFilter;
        return matchSearch && matchStatus;
      }),
    [search, statusFilter]
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50">
            <tr>
              {[
                "Transaction ID",
                "Vendor",
                "Amount",
                "Commission",
                "Date",
                "Status",
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length > 0 ? (
              filtered.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 text-sm font-mono text-indigo-600">
                    {t.id}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-800">
                    {t.vendor}
                  </td>
                  <td className="px-4 py-4 text-sm font-semibold text-gray-800">
                    {inr(t.amount)}
                  </td>
                  <td className="px-4 py-4 text-sm text-emerald-700 font-medium">
                    {inr(t.commission)}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500">{t.date}</td>
                  <td className="px-4 py-4">
                    <StatusBadge status={t.status} />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="6"
                  className="px-4 py-10 text-center text-sm text-gray-400"
                >
                  No transactions match your filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Showing{" "}
          <span className="font-medium text-gray-700">{filtered.length}</span>{" "}
          transactions
        </p>
      </div>
    </div>
  );
};

// ─── Payouts tab ──────────────────────────────────────────────────────────────

const PayoutsTab = ({ search, statusFilter }) => {
  const filtered = useMemo(
    () =>
      PAYOUTS.filter((p) => {
        const q = search.toLowerCase();
        const matchSearch =
          p.id.toLowerCase().includes(q) || p.vendor.toLowerCase().includes(q);
        const matchStatus = statusFilter === "all" || p.status === statusFilter;
        return matchSearch && matchStatus;
      }),
    [search, statusFilter]
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50">
            <tr>
              {["Payout ID", "Vendor", "Amount", "Date", "Status", ""].map(
                (h) => (
                  <th
                    key={h}
                    className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length > 0 ? (
              filtered.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 text-sm font-mono text-indigo-600">
                    {p.id}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-800">
                    {p.vendor}
                  </td>
                  <td className="px-4 py-4 text-sm font-semibold text-gray-800">
                    {inr(p.amount)}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500">{p.date}</td>
                  <td className="px-4 py-4">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-indigo-600 transition-colors"
                        title="View details"
                      >
                        <FileText className="h-4 w-4" />
                      </button>
                      {p.status === "pending" && (
                        <button
                          className="p-1.5 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors"
                          title="Approve payout"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="6"
                  className="px-4 py-10 text-center text-sm text-gray-400"
                >
                  No payouts match your filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Showing{" "}
          <span className="font-medium text-gray-700">{filtered.length}</span>{" "}
          payouts
        </p>
      </div>
    </div>
  );
};

// ─── Overview tab ─────────────────────────────────────────────────────────────

const OverviewTab = () => {
  const commissionData = [
    {
      vendor: "Laundry Express",
      tier: "Premium Partner",
      rate: 8,
      color: "bg-green-100 text-green-800",
    },
    {
      vendor: "Clean & Fold Co.",
      tier: "Premium Partner",
      rate: 8,
      color: "bg-green-100 text-green-800",
    },
    {
      vendor: "Wash Kings",
      tier: "Standard",
      rate: 10,
      color: "bg-indigo-100 text-indigo-800",
    },
    {
      vendor: "Fast Dry Cleaners",
      tier: "New Partner",
      rate: 12,
      color: "bg-amber-100 text-amber-800",
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Revenue placeholder */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-gray-700">
            Revenue breakdown
          </h3>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
              Commission
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              Vendor earnings
            </span>
          </div>
        </div>
        <div className="h-56 flex flex-col items-center justify-center bg-gray-50 rounded-xl border border-gray-100 gap-2">
          <TrendingUp className="h-10 w-10 text-gray-300" />
          <p className="text-sm text-gray-400">Chart coming soon</p>
        </div>
      </div>

      {/* Commission structure */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">
          Commission structure
        </h3>

        {/* Default rate bar */}
        <div className="mb-5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Default rate</span>
            <span className="text-xs font-semibold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
              10%
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-2 bg-indigo-500 rounded-full"
              style={{ width: "10%" }}
            />
          </div>
        </div>

        {/* Vendor-specific rates */}
        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
          Vendor-specific rates
        </h4>
        <div className="space-y-3">
          {commissionData.map(({ vendor, tier, rate, color }) => (
            <div
              key={vendor}
              className="flex items-center justify-between py-2.5 px-3 bg-gray-50 rounded-lg"
            >
              <div>
                <p className="text-sm font-medium text-gray-800">{vendor}</p>
                <p className="text-xs text-gray-400">{tier}</p>
              </div>
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${color}`}
              >
                {rate}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Settings tab ─────────────────────────────────────────────────────────────

const SettingsTab = () => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
    {/* Commission settings */}
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-5">
        Default commission settings
      </h3>
      <div className="space-y-5">
        {[
          {
            label: "Default commission rate",
            hint: "Applied to all vendors unless overridden",
            def: 10,
          },
          {
            label: "New dhobi commission rate",
            hint: "Applied to newly registered vendors",
            def: 12,
          },
          {
            label: "Premium partner rate",
            hint: "Applied to vendors with premium status",
            def: 8,
          },
        ].map(({ label, hint, def }) => (
          <div key={label}>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {label}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                defaultValue={def}
                min={0}
                max={100}
                className="w-24 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <span className="text-sm text-gray-500">%</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">{hint}</p>
          </div>
        ))}
        <button className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
          Save changes
        </button>
      </div>
    </div>

    {/* Payout settings */}
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-5">
        Payout settings
      </h3>
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Minimum payout amount
          </label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">₹</span>
            <input
              type="number"
              defaultValue={500}
              min={0}
              className="w-32 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Minimum balance required for automatic payout
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Payout schedule
          </label>
          <select className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
            <option value="weekly">Weekly (Every Monday)</option>
            <option value="biweekly">Bi-weekly (1st and 15th)</option>
            <option value="monthly">Monthly (Last day)</option>
          </select>
          <p className="text-xs text-gray-400 mt-1">
            How often payouts are processed automatically
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Payment methods
          </label>
          <div className="space-y-2">
            {[
              { id: "upi", label: "UPI Transfer", checked: true },
              { id: "bank", label: "Bank Transfer (NEFT/IMPS)", checked: true },
              { id: "wallet", label: "Digital Wallet", checked: false },
            ].map(({ id, label, checked }) => (
              <label
                key={id}
                className="flex items-center gap-2.5 cursor-pointer"
              >
                <input
                  type="checkbox"
                  id={id}
                  defaultChecked={checked}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </div>

        <button className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
          Save changes
        </button>
      </div>
    </div>
  </div>
);

// ─── Main ─────────────────────────────────────────────────────────────────────

const RevenuePayments = () => {
  const [tab, setTab] = useState("overview");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().slice(0, 10),
    end: new Date().toISOString().slice(0, 10),
  });

  const summary = useMemo(
    () => ({
      totalRevenue: TRANSACTIONS.reduce((s, t) => s + t.amount, 0),
      totalCommission: TRANSACTIONS.reduce((s, t) => s + t.commission, 0),
      pendingPayouts: PAYOUTS.filter((p) => p.status === "pending").reduce(
        (s, p) => s + p.amount,
        0
      ),
      failedAmount: TRANSACTIONS.filter((t) => t.status === "failed").reduce(
        (s, t) => s + t.amount,
        0
      ),
      pendingVendors: new Set(
        PAYOUTS.filter((p) => p.status === "pending").map((p) => p.vendor)
      ).size,
      failedCount: TRANSACTIONS.filter((t) => t.status === "failed").length,
    }),
    []
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Revenue & Payments
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Track earnings, commissions and payouts
            </p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm transition-colors">
              <Download className="h-4 w-4" />
              Export
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors">
              <CreditCard className="h-4 w-4" />
              Process payouts
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Revenue"
            value={inr(summary.totalRevenue)}
            sub="All transactions"
            color="indigo"
            Icon={IndianRupee}
          />
          <StatCard
            title="Admin Commission"
            value={inr(summary.totalCommission)}
            sub="Platform fee collected"
            color="emerald"
            Icon={TrendingUp}
          />
          <StatCard
            title="Pending Payouts"
            value={inr(summary.pendingPayouts)}
            sub={`${summary.pendingVendors} vendors waiting`}
            color="amber"
            Icon={Clock}
          />
          <StatCard
            title="Failed Transactions"
            value={inr(summary.failedAmount)}
            sub={`${summary.failedCount} transactions failed`}
            color="red"
            Icon={XCircle}
          />
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex border-b border-gray-100 px-2">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-5 py-3.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  tab === t
                    ? "text-indigo-600 border-indigo-600"
                    : "text-gray-500 border-transparent hover:text-gray-700"
                }`}
              >
                {TAB_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        {/* Filters — only for transactions and payouts */}
        {(tab === "transactions" || tab === "payouts") && (
          <FiltersBar
            search={search}
            setSearch={setSearch}
            status={status}
            setStatus={setStatus}
            dateRange={dateRange}
            setDateRange={setDateRange}
          />
        )}

        {/* Tab content */}
        {tab === "overview" && <OverviewTab />}
        {tab === "transactions" && (
          <TransactionsTab search={search} statusFilter={status} />
        )}
        {tab === "payouts" && (
          <PayoutsTab search={search} statusFilter={status} />
        )}
        {tab === "settings" && <SettingsTab />}
      </div>
    </div>
  );
};

export default RevenuePayments;
