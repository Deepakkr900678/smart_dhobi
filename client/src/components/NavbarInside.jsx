import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";

import NotificationBell from "./NotificationBell";
import { getCurrentMainUserId } from "../auth/ApiConnect";
const Navbar = ({}) => {
  const navigate = useNavigate();
  const currentMainUserId = getCurrentMainUserId();
  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-purple-100 sticky top-0 z-50">
      <div className="">
        <div className="flex justify-end items-center h-16">
          <div>
            <div className="flex items-center space-x-2 px-4">
              <NotificationBell userId={currentMainUserId} />
              <button
                onClick={() => localStorage.clear() || navigate("/login")}
                className="flex items-center space-x-2 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              >
                <LogOut size={18} />
                <span>Log-Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
