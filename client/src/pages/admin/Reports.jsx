import React, { useState } from 'react';
import { 
  BarChart, 
  PieChart, 
  LineChart, 
  Calendar, 
  ArrowUpRight, 
  TrendingUp, 
  Map, 
  Download 
} from 'lucide-react';

const Reports = () => {
  const [reportType, setReportType] = useState('daily');
  const [reportFormat, setReportFormat] = useState('csv');
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().substr(0, 10),
    end: new Date().toISOString().substr(0, 10)
  });

  // Mock data for charts
  const dailyOrdersData = [
    { day: 'Mon', orders: 145 },
    { day: 'Tue', orders: 132 },
    { day: 'Wed', orders: 164 },
    { day: 'Thu', orders: 187 },
    { day: 'Fri', orders: 213 },
    { day: 'Sat', orders: 252 },
    { day: 'Sun', orders: 179 }
  ];

  const topVendorsData = [
    { name: 'Laundry Express', revenue: 12500, orders: 238 },
    { name: 'Clean & Fold Co.', revenue: 9800, orders: 195 },
    { name: 'Wash Kings', revenue: 8700, orders: 172 },
    { name: 'Quick Press', revenue: 7200, orders: 146 },
    { name: 'Spotless Laundry', revenue: 6300, orders: 124 }
  ];

  const handleExportReport = () => {
    // Logic to export report would go here
    alert(`Exporting ${reportType} report in ${reportFormat} format`);
  };

  return (
    <div className=" bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6 pt-6">
        <h1 className="text-2xl font-bold text-gray-800">Reports & Insights</h1>
        <div className="flex gap-4">
          <button 
            className="btn btn-outline flex items-center gap-2"
            onClick={handleExportReport}
          >
            <Download size={28} />
            Export
          </button>
          <select 
            className="btn btn-outline flex items-center gap-2"
            value={reportFormat}
            onChange={(e) => setReportFormat(e.target.value)}
          >
            <option value="csv">CSV</option>
            <option value="pdf">PDF</option>
            <option value="excel">Excel</option>
          </select>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="card mb-6 flex items-center justify-between p-4 bg-white  rounded">
        <div className="flex items-center gap-4 mb-4">
          <h2 className="text-lg font-medium text-gray-700">Report Type:</h2>
          <div className="flex gap-2">
            <button 
              className={`btn ${reportType === 'daily' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setReportType('daily')}
            >
              Daily
            </button>
            <button 
              className={`btn ${reportType === 'weekly' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setReportType('weekly')}
            >
              Weekly
            </button>
            <button 
              className={`btn ${reportType === 'monthly' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setReportType('monthly')}
            >
              Monthly
            </button>
          </div>
        </div>

        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="form-label">From:</label>
            <input 
              type="date" 
              className="form-input p-2" 
              value={dateRange.start}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="form-label">To:</label>
            <input 
              type="date" 
              className="form-input p-2" 
              value={dateRange.end}
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
            />
          </div>
          <button className="btn btn-primary">
            Apply
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="stat-card border-l-indigo-500">
          <div className="flex justify-between items-center">
            <h3 className="text-gray-500 text-sm font-medium">Total Orders</h3>
            <span className="text-green-500 flex items-center text-xs font-medium">
              <ArrowUpRight size={14} />
              12.5%
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-800 mt-2">1,254</p>
          <p className="text-xs text-gray-500 mt-1">Compared to last period</p>
        </div>

        <div className="stat-card border-l-emerald-500">
          <div className="flex justify-between items-center">
            <h3 className="text-gray-500 text-sm font-medium">Revenue</h3>
            <span className="text-green-500 flex items-center text-xs font-medium">
              <ArrowUpRight size={14} />
              8.3%
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-800 mt-2">₹85,429</p>
          <p className="text-xs text-gray-500 mt-1">Compared to last period</p>
        </div>

        <div className="stat-card border-l-amber-500">
          <div className="flex justify-between items-center">
            <h3 className="text-gray-500 text-sm font-medium">New Users</h3>
            <span className="text-green-500 flex items-center text-xs font-medium">
              <ArrowUpRight size={14} />
              5.2%
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-800 mt-2">238</p>
          <p className="text-xs text-gray-500 mt-1">Compared to last period</p>
        </div>

        <div className="stat-card border-l-red-500">
          <div className="flex justify-between items-center">
            <h3 className="text-gray-500 text-sm font-medium">Vendor Signups</h3>
            <span className="text-green-500 flex items-center text-xs font-medium">
              <ArrowUpRight size={14} />
              3.7%
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-800 mt-2">42</p>
          <p className="text-xs text-gray-500 mt-1">Compared to last period</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Daily Orders Chart */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-700 flex items-center gap-2">
              <BarChart size={20} className="text-indigo-600" />
              Daily Orders
            </h3>
            <div className="flex gap-2">
              <button className="btn btn-outline text-xs px-2 py-1">This Week</button>
              <button className="btn btn-outline text-xs px-2 py-1">Last Week</button>
            </div>
          </div>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
            {/* Chart would be rendered here - using placeholder */}
            <div className="flex flex-col items-center">
              <BarChart size={48} className="text-gray-300 mb-2" />
              <p className="text-gray-500 text-sm">Daily Orders Chart</p>
            </div>
          </div>
        </div>

        {/* Revenue Trends */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-700 flex items-center gap-2">
              <LineChart size={20} className="text-emerald-600" />
              Revenue Trends
            </h3>
            <div className="flex gap-2">
              <button className="btn btn-outline text-xs px-2 py-1">This Month</button>
              <button className="btn btn-outline text-xs px-2 py-1">Last Month</button>
            </div>
          </div>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
            {/* Chart would be rendered here - using placeholder */}
            <div className="flex flex-col items-center">
              <LineChart size={48} className="text-gray-300 mb-2" />
              <p className="text-gray-500 text-sm">Revenue Trends Chart</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Vendors */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-700 flex items-center gap-2">
              <TrendingUp size={20} className="text-indigo-600" />
              Top Performing Vendors
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Growth</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topVendorsData.map((vendor, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{vendor.name}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{vendor.orders}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">₹{vendor.revenue.toLocaleString()}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-green-500 flex items-center">
                      <ArrowUpRight size={14} className="mr-1" />
                      {Math.floor(Math.random() * 20) + 5}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Demand Heatmap */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-700 flex items-center gap-2">
              <Map size={20} className="text-emerald-600" />
              Demand Heatmap
            </h3>
            <select className="form-input text-sm">
              <option>All Services</option>
              <option>Wash & Fold</option>
              <option>Dry Cleaning</option>
              <option>Ironing</option>
            </select>
          </div>
          <div className="h-72 flex items-center justify-center bg-gray-50 rounded">
            {/* Map would be rendered here - using placeholder */}
            <div className="flex flex-col items-center">
              <Map size={48} className="text-gray-300 mb-2" />
              <p className="text-gray-500 text-sm">Area Demand Heatmap</p>
              <p className="text-gray-400 text-xs mt-1">Shows high-demand areas for laundry services</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;