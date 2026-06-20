// User Avatar Component
import React from 'react';

const UserAvatar = ({ name, size = "md" }) => {
  const sizeClasses = {
    sm: "h-8 w-8 text-sm",
    md: "h-10 w-10 text-base",
    lg: "h-16 w-16 text-xl"
  };

  return (
    <div className={`${sizeClasses[size]} bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0`}>
      <span className="text-indigo-600 font-medium">
        {name.split(" ").map((n) => n[0]).join("").toUpperCase()}
      </span>
    </div>
  );
};

export default UserAvatar;