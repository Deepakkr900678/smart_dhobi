import React from "react";
import logo from "../assets/logo.png";
import { Phone, Mail, Link } from "lucide-react";

const Footer = () => (
  <footer className="bg-gray-900 text-white py-12">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center space-x-3 mb-4">
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 md:w-24 md:h-24 flex items-center justify-center">
                <img
                  src={logo}
                  alt="Smart Dhobi Logo"
                  className="w-full h-full object-contain mb-2"
                />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold">Smart Dhobi</h3>
              <p className="text-sm text-gray-400">Premium Laundry</p>
            </div>
          </div>
          <p className="text-gray-400">
            Professional laundry services at your doorstep with guaranteed
            quality and satisfaction.
          </p>
        </div>

        <div>
          <h4 className="text-lg font-semibold mb-4">Services</h4>
          <ul className="space-y-2 text-gray-400">
            <li>Wash & Fold</li>
            <li>Dry Cleaning</li>
            <li>Express Service</li>
            <li>Ironing Service</li>
          </ul>
        </div>

        <div>
          <h4 className="text-lg font-semibold mb-4">Company</h4>
          <ul className="space-y-2 text-gray-400">
            <li>
              <Link to="/aboutUs">About Us</Link>
            </li>
            <li>
              <Link to="/contact">Contact</Link>
            </li>
            <li>
              <Link to="/terms-conditions">Terms of Service</Link>
            </li>
            <li>
              <Link to="/privacy-policy">Privacy Policy</Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-lg font-semibold mb-4">Contact</h4>
          <div className="space-y-2 text-gray-400">
            <div className="flex items-center space-x-2">
              <Phone size={16} />
              <span>+91 7558618689</span>
            </div>
            <div className="flex items-center space-x-2">
              <Mail size={16} />
              <span>info@smartdhobi.in</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
        <p>&copy; 2025 Smart Dhobi. All rights reserved.</p>
      </div>
    </div>
  </footer>
);

export default Footer;
