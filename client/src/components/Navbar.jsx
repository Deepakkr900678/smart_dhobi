import React, { useState } from "react";
import { LogIn, UserPlus, Menu, X } from "lucide-react";
import logo from "../assets/logo.png";
import { useNavigate, Link } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLoginClick = () => {
    navigate("/login");
    setIsMenuOpen(false);
  };

  const handleRegisterClick = (type) => {
    navigate("/dhobi-register");

    setIsMenuOpen(false);
  };

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-purple-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-18 md:h-20">
          {/* Logo - Responsive sizing */}
          <div
            className="flex items-center space-x-2 sm:space-x-3 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 flex items-center justify-center">
                <img
                  src={logo}
                  alt="Smart Dhobi Logo"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg md:text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent leading-tight truncate">
                Smart Dhobi
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5 truncate">
                Premium Laundry
              </p>
            </div>
          </div>

          {/* Desktop Navigation - Hidden on mobile/tablet */}
          <div className="hidden lg:flex items-center space-x-4 xl:space-x-6">
            <Link
              to="/#services"
              className="text-gray-700 hover:text-purple-600 transition-colors font-medium text-sm xl:text-base whitespace-nowrap"
            >
              Services
            </Link>
            <Link
              to="/#how-it-works"
              className="text-gray-700 hover:text-purple-600 transition-colors font-medium text-sm xl:text-base whitespace-nowrap"
            >
              How it Works
            </Link>
            <Link
              to="/#nearby"
              className="text-gray-700 hover:text-purple-600 transition-colors font-medium text-sm xl:text-base whitespace-nowrap"
            >
              Find Nearby
            </Link>
            <Link
              to="/aboutUs"
              className="text-gray-700 hover:text-purple-600 transition-colors font-medium text-sm xl:text-base whitespace-nowrap"
            >
              About Us
            </Link>
            <Link
              to="/privacy-policy"
              className="text-gray-700 hover:text-purple-600 transition-colors font-medium text-sm xl:text-base whitespace-nowrap"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms-conditions"
              className="text-gray-700 hover:text-purple-600 transition-colors font-medium text-sm xl:text-base whitespace-nowrap"
            >
              Terms & Conditions
            </Link>

            <div className="flex items-center space-x-2 xl:space-x-3 ml-2">
              <button
                onClick={handleLoginClick}
                className="flex items-center space-x-1.5 px-3 xl:px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors text-sm xl:text-base"
              >
                <LogIn size={16} className="xl:w-[18px] xl:h-[18px]" />
                <span>Login</span>
              </button>
              <button
                onClick={() => handleRegisterClick("vendor")}
                className="flex items-center space-x-1.5 px-4 xl:px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-300 text-sm xl:text-base whitespace-nowrap"
              >
                <UserPlus size={16} className="xl:w-[18px] xl:h-[18px]" />
                <span>Register</span>
              </button>
            </div>
          </div>

          {/* Mobile/Tablet menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-purple-50 transition-colors z-50 relative"
            aria-label="Toggle menu"
            type="button"
          >
            {isMenuOpen ? (
              <X size={24} className="text-gray-700" />
            ) : (
              <Menu size={24} className="text-gray-700" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile/Tablet Navigation */}
      {isMenuOpen && (
        <div className="lg:hidden bg-white/95 backdrop-blur-md border-t border-purple-100 shadow-lg">
          <div className="px-4 sm:px-6 py-4 space-y-1 max-h-[calc(100vh-5rem)] overflow-y-auto">
            <a
              href="/#services"
              onClick={() => setIsMenuOpen(false)}
              className="block py-2.5 px-3 text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors text-base"
            >
              Services
            </a>
            <a
              href="/#how-it-works"
              onClick={() => setIsMenuOpen(false)}
              className="block py-2.5 px-3 text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors text-base"
            >
              How it Works
            </a>
            <a
              href="/#nearby"
              onClick={() => setIsMenuOpen(false)}
              className="block py-2.5 px-3 text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors text-base"
            >
              Find Nearby
            </a>
            <a
              href="/aboutUs"
              onClick={() => setIsMenuOpen(false)}
              className="block py-2.5 px-3 text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors text-base"
            >
              About Us
            </a>
            <a
              href="/privacy-policy"
              onClick={() => setIsMenuOpen(false)}
              className="block py-2.5 px-3 text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors text-base"
            >
              Privacy Policy
            </a>
            <a
              href="/terms-conditions"
              onClick={() => setIsMenuOpen(false)}
              className="block py-2.5 px-3 text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors text-base"
            >
              Terms & Conditions
            </a>

            <hr className="border-purple-100 my-3" />

            <button
              onClick={handleLoginClick}
              className="flex items-center space-x-2 w-full py-2.5 px-3 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors text-base"
            >
              <LogIn size={18} />
              <span>Login</span>
            </button>
            <button
              onClick={() => handleRegisterClick("customer")}
              className="flex items-center justify-center space-x-2 w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-300 text-base font-medium"
            >
              <UserPlus size={18} />
              <span>Register</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
