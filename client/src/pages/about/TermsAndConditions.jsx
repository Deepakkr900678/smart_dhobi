import React from 'react';
import { FileText, CheckCircle, AlertCircle, Scale, Shield, Users, CreditCard, RefreshCw, Bell } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

function TermsAndConditions() {
  const sections = [
    {
      number: "1",
      icon: CheckCircle,
      title: "Acceptance",
      content: "By using SmartDhobi services, you agree to these Terms and our Privacy Policy.",
      color: "from-purple-500 to-pink-500"
    },
    {
      number: "2",
      icon: Users,
      title: "Services",
      content: "We provide on-demand ironing and laundry services connecting you to local vendors (\"Dhobis\"). SmartDhobi solely facilitates the transaction and booking process.",
      color: "from-blue-500 to-purple-500"
    },
    {
      number: "3",
      icon: CreditCard,
      title: "Booking & Payment",
      content: "All service bookings, slots, pricing, and payments must be completed through the SmartDhobi platform.",
      color: "from-green-500 to-blue-500"
    },
    {
      number: "4",
      icon: RefreshCw,
      title: "Cancellations & Refunds",
      content: "Customers may cancel within X hours. Late cancellations or no-shows will incur a fee. Refunds processed as per SmartDhobi policy.",
      color: "from-pink-500 to-red-500"
    },
    {
      number: "5",
      icon: AlertCircle,
      title: "User Responsibilities",
      content: "Customers must ensure items are properly labeled and free from prohibited items (flammable, hazardous). SmartDhobi and Dhobis are not liable for damages due to prohibited items.",
      color: "from-yellow-500 to-orange-500"
    },
    {
      number: "6",
      icon: Shield,
      title: "Vendor Conduct",
      content: "Dhobis must comply with service standards, respond timely to orders, and provide accurate pricing receipts.",
      color: "from-indigo-500 to-purple-500"
    },
    {
      number: "7",
      icon: Scale,
      title: "Liability",
      content: "SmartDhobi acts as a facilitator. While we vet Dhobis, we are not liable for lost or damaged items except as required by law.",
      color: "from-red-500 to-pink-500"
    },
    {
      number: "8",
      icon: Bell,
      title: "Changes to Terms",
      content: "We may update these terms. Any material changes will prompt a notice on the app/website.",
      color: "from-teal-500 to-green-500"
    },
    {
      number: "9",
      icon: FileText,
      title: "Governing Law",
      content: "These terms are governed under the laws of India.",
      color: "from-purple-500 to-blue-500"
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
                <FileText className="text-white w-10 h-10" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-purple-800 bg-clip-text text-transparent">
                Terms of Service
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              SmartDhobi Terms of Service - Please read these terms carefully before using our services
            </p>
          </div>

          {/* Terms Grid */}
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
                    <p className="text-gray-600 leading-relaxed">
                      {section.content}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Important Notice */}
          <div className="bg-gradient-to-br from-purple-600 to-pink-500 rounded-3xl p-8 md:p-10 text-white shadow-2xl">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-3">Important Information</h3>
                <p className="text-purple-100 leading-relaxed mb-4">
                  By using SmartDhobi services, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. These terms constitute a legally binding agreement between you and SmartDhobi.
                </p>
                <p className="text-purple-100 leading-relaxed">
                  If you have any questions about these terms, please contact our support team before using our services. We're here to help ensure you have a clear understanding of your rights and responsibilities.
                </p>
              </div>
            </div>
          </div>

          {/* Last Updated */}
          <div className="text-center mt-12">
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

export default TermsAndConditions;