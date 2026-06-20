import React ,{useState} from "react"
const StatsCard = ({ title, value, subtitle, icon, color = 'blue' }) => {
  const colorClasses = {
    blue: 'border-l-blue-500 bg-blue-50',
    orange: 'border-l-orange-500 bg-orange-50',
    green: 'border-l-green-500 bg-green-50',
    red: 'border-l-red-500 bg-red-50',
    purple: 'border-l-purple-500 bg-purple-50'
  };

  return (
    <div className={`${colorClasses[color]} border-l-4 p-6 rounded-lg`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-gray-600 text-sm font-medium uppercase tracking-wide">{title}</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {/* {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>} */}
        </div>
        <div className="text-gray-400">
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatsCard;