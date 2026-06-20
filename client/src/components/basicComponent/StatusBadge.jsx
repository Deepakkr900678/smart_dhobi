// Status Badge Component
import React from 'react';

const StatusBadge = ({ status, isVerified }) => (
  <div className="flex flex-col gap-1">
    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
      status === "active" 
        ? "bg-green-100 text-green-800" 
        : "bg-red-100 text-red-800"
    }`}>
      {status === "active" ? "Active" : "Suspended"}
    </span>
    {isVerified && (
      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
        Verified
      </span>
    )}
  </div>
);

export default StatusBadge;