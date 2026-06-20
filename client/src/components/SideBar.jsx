import React from "react";
import { NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";
import logo from "../assets/logo.png";

function SideBar({ isActive, navItems, sidebarOpen, setSidebarOpen }) {
  return (
    <>
      {/* Top logo bar */}
      <div
        className={`fixed left-0 top-0 z-50 bg-white shadow-md flex items-center transition-all duration-300 ${
          sidebarOpen ? "w-56" : "w-16"
        } h-16 px-2`}
      >
        <img src={logo} alt="Logo" className="h-24 w-24 object-contain" />
        {/* {sidebarOpen && (
          <h1 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent ml-2">
            Smart Dhobi
          </h1>
        )} */}
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed top-16 left-0 z-40 bg-white shadow-md transition-all duration-300 h-[calc(100%-5rem)] ${
          sidebarOpen ? "w-56" : "w-16"
        }`}
        onMouseEnter={() => setSidebarOpen(true)}
        onMouseLeave={() => setSidebarOpen(false)}
      >
        {/* Menu Toggle */}
        <div className="flex items-center justify-between px-2 mt-4">
          {sidebarOpen && (
            <span className="font-semibold text-base px-4">Menu</span>
          )}
          <button
            className="p-1 rounded hover:bg-gray-200 ml-2"
            onClick={() => setSidebarOpen((prev) => !prev)}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? null : <Menu size={22} />}
          </button>
        </div>

        {/* Navigation Links */}
        <div className="mt-6">
          {navItems.map((item, index) => (
            <NavLink
              key={index}
              to={item.path}
              className={`flex items-center py-2 px-4 mx-2 rounded transition-colors hover:bg-gray-100 ${
                isActive(item.path)
                  ? "bg-purple-100 text-purple-600 font-medium"
                  : "text-gray-700"
              }`}
              style={{
                justifyContent: sidebarOpen ? "flex-start" : "center",
              }}
            >
              <span className={sidebarOpen ? "mr-3" : ""}>
                {React.cloneElement(item.icon, { size: 20 })}
              </span>
              {sidebarOpen && (
                <span className="whitespace-nowrap">{item.label}</span>
              )}
            </NavLink>
          ))}
        </div>
      </aside>
    </>
  );
}

export default SideBar;
