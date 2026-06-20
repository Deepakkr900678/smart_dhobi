import React from 'react';
import { Shield, Lock, Database, Share2, Eye, Cookie, Clock, UserCheck, RefreshCw, Mail } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

function PrivacyPolicy() {
  const sections = [
    {
      number: "1",
      icon: Shield,
      title: "Introduction",
      content: "SmartDhobi (\"we,\" \"us,\" \"our\") is committed to protecting your privacy and ensuring reliable data handling on smartdhobi.in and our mobile app.",
      color: "from-purple-500 to-pink-500"
    },
    {
      number: "2",
      icon: Database,
      title: "Data Collected",
      content: "User info: Name, contact, address, delivery details. Order data: Service type, dates, payment method. Payment data: Transaction IDs via Paytm or cash receipts. Device data: App usage, device model, OS, IP address, and optionally location for service matching.",
      color: "from-blue-500 to-purple-500",
      items: [
        "User info: Name, contact, address, delivery details",
        "Order data: Service type, dates, payment method",
        "Payment data: Transaction IDs via Paytm or cash receipts",
        "Device data: App usage, device model, OS, IP address, and location"
      ]
    },
    {
      number: "3",
      icon: Eye,
      title: "Usage of Data",
      content: "To process bookings, assign Dhobis, and track orders. For communication: notifications, reminders, and support. To improve our services, analytics, and marketing efforts.",
      color: "from-green-500 to-blue-500",
      items: [
        "To process bookings, assign Dhobis, and track orders",
        "For communication: notifications, reminders, and support",
        "To improve our services, analytics, and marketing efforts"
      ]
    },
    {
      number: "4",
      icon: Share2,
      title: "Data Sharing",
      content: "With Dhobis: Only delivery essentials. Third parties: Payment gateways (e.g. Paytm), cloud or analytics providers. Legal reasons: If required by law or to protect rights.",
      color: "from-yellow-500 to-orange-500",
      items: [
        "With Dhobis: Only delivery essentials",
        "Third parties: Payment gateways (e.g. Paytm), cloud or analytics providers",
        "Legal reasons: If required by law or to protect rights"
      ]
    },
    {
      number: "5",
      icon: Lock,
      title: "Security",
      content: "We use industry-standard SSL encryption and secure storage practices. Access to personal data is restricted.",
      color: "from-red-500 to-pink-500"
    },
    {
      number: "6",
      icon: Cookie,
      title: "Cookies & Tracking",
      content: "Our website may use cookies and similar tools to personalize content and usage.",
      color: "from-indigo-500 to-purple-500"
    },
    {
      number: "7",
      icon: Clock,
      title: "Data Retention",
      content: "We retain data as long as needed for business purposes or until legally required.",
      color: "from-teal-500 to-green-500"
    },
    {
      number: "8",
      icon: UserCheck,
      title: "Your Rights",
      content: "You can request access, correction, deletion of personal data by contacting us.",
      color: "from-pink-500 to-red-500"
    },
    {
      number: "9",
      icon: RefreshCw,
      title: "Privacy Updates",
      content: "Policy updates will be posted here with a new effective date.",
      color: "from-purple-500 to-blue-500"
    },
    {
      number: "10",
      icon: Mail,
      title: "Contact Us",
      content: "For privacy questions, reach us at info@smartdhobi.in.",
      color: "from-blue-500 to-teal-500"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <Navbar/>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20">
        {/* Background Animation */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-32 h-32 bg-purple-200 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-24 h-24 bg-pink-200 rounded-full opacity-20 animate-bounce"></div>
          <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-yellow-200 rounded-full opacity-20 animate-ping"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="text-center mb-16">
            <div className="flex items-center justify-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-500 rounded-2xl flex items-center justify-center">
                <Shield className="text-white w-10 h-10" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-purple-800 bg-clip-text text-transparent">
                Privacy Policy
              </span>
              
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              SmartDhobi Privacy Policy - Your privacy matters to us. Learn how we collect, use, and protect your data.
            </p>
          </div>

          {/* Privacy Commitment Banner */}
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 md:p-10 border border-purple-100 shadow-xl mb-12">
            <div className="flex items-start space-x-6">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-2xl flex items-center justify-center">
                  <Lock className="text-white w-8 h-8" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  Our Commitment to Your Privacy
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  At SmartDhobi, we understand the importance of your personal information. We are committed to protecting your privacy and ensuring reliable data handling across smartdhobi.in and our mobile app. This policy outlines how we collect, use, share, and protect your data.
                </p>
              </div>
            </div>
          </div>

          {/* Privacy Sections Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {sections.map((section, index) => (
              <div
                key={index}
                className="group bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-purple-100 hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <div className="flex items-start space-x-4">
                  <div className="relative flex-shrink-0">
                    <div className={`w-16 h-16 bg-gradient-to-br ${section.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <section.icon className="text-white w-8 h-8" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-7 h-7 bg-white border-2 border-purple-200 rounded-full flex items-center justify-center text-xs font-bold text-purple-600">
                      {section.number}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      {section.title}
                    </h3>
                    {section.items ? (
                      <ul className="space-y-2">
                        {section.items.map((item, idx) => (
                          <li key={idx} className="text-gray-600 text-sm leading-relaxed flex items-start">
                            <span className="text-purple-500 mr-2 flex-shrink-0">●</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-600 leading-relaxed">
                        {section.content}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Contact Section */}
          <div className="bg-gradient-to-br from-purple-600 to-pink-500 rounded-3xl p-8 md:p-10 text-white shadow-2xl mb-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
                <Mail className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Have Privacy Questions?</h3>
              <p className="text-purple-100 leading-relaxed mb-6 max-w-2xl mx-auto">
                We're here to help. If you have any questions about how we handle your data or would like to exercise your privacy rights, please don't hesitate to reach out to us.
              </p>
              <a 
                href="mailto:info@smartdhobi.in"
                className="inline-flex items-center space-x-2 bg-white text-purple-600 px-8 py-3 rounded-full font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300"
              >
                <Mail size={20} />
                <span>info@smartdhobi.in</span>
              </a>
            </div>
          </div>

          {/* Your Rights Highlight */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 border border-purple-100 shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-4">
                <Eye className="text-white w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">Access Your Data</h4>
              <p className="text-gray-600 text-sm">Request a copy of the personal data we hold about you</p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-purple-100 shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center mb-4">
                <RefreshCw className="text-white w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">Correct Your Data</h4>
              <p className="text-gray-600 text-sm">Update or correct any inaccurate information</p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-purple-100 shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center mb-4">
                <UserCheck className="text-white w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">Delete Your Data</h4>
              <p className="text-gray-600 text-sm">Request deletion of your personal information</p>
            </div>
          </div>

          {/* Last Updated */}
          <div className="text-center">
            <p className="text-gray-500 text-sm">
              Last updated: January 2025 | SmartDhobi - Smart Press, Bina Stress
            </p>
          </div>
        </div>
      </section>
      <Footer/>
    </div>
  );
}

export default PrivacyPolicy;