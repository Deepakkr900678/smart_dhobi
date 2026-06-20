import React from 'react';
import { Sparkles, Target, Shield, Star, Award, Users, Heart, Zap } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

function AboutUs() {
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
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-purple-800 bg-clip-text text-transparent">
                About SmartDhobi
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              India's smart on-demand ironing and laundry platform, bringing quality and convenience to your doorstep
            </p>
          </div>

          {/* Main Content Card */}
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 md:p-12 border border-purple-100 shadow-xl mb-12">
            {/* <div className="flex items-center justify-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-500 rounded-2xl flex items-center justify-center">
                <Sparkles className="text-white w-10 h-10" />
              </div>
            </div> */}
            
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
              Welcome to SmartDhobi
            </h2>
            
            <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
              <p className="text-center text-lg leading-relaxed">
                Founded with a passion for quality and convenience, we connect you with a trusted network of local ironing professionals. Our mission is simple: <span className="font-semibold text-purple-600">"Smart Press, Bina Stress."</span> You focus on your day—we'll take care of your wardrobe.
              </p>
              
              <p className="text-center text-lg leading-relaxed">
                At SmartDhobi, every pressing job is handled by trained, verified vendors equipped with the best tools. We pride ourselves on transparency: digital booking, real-time tracking, secure payments, and top-quality ironing standards.
              </p>
              
              <p className="text-center text-lg leading-relaxed font-medium text-purple-700">
                Join us in bringing urban ease to every garment—no more stress, just crisp, fresh clothes at your doorstep.
              </p>
            </div>
          </div>

          {/* Mission & Values Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="group bg-white rounded-2xl p-6 border border-purple-100 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Target className="text-white w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">Our Mission</h3>
              <p className="text-gray-600 text-center text-sm">
                Smart Press, Bina Stress - delivering quality laundry services with zero hassle
              </p>
            </div>

            <div className="group bg-white rounded-2xl p-6 border border-purple-100 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Shield className="text-white w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">Verified Vendors</h3>
              <p className="text-gray-600 text-center text-sm">
                All dhobis are trained, verified, and equipped with professional tools
              </p>
            </div>

            <div className="group bg-white rounded-2xl p-6 border border-purple-100 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-pink-500 to-red-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Zap className="text-white w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">Transparency</h3>
              <p className="text-gray-600 text-center text-sm">
                Digital booking, real-time tracking, and secure payment systems
              </p>
            </div>

            <div className="group bg-white rounded-2xl p-6 border border-purple-100 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-yellow-500 to-pink-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Star className="text-white w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">Top Quality</h3>
              <p className="text-gray-600 text-center text-sm">
                Premium ironing standards maintained for every single garment
              </p>
            </div>
          </div>

          {/* Why Choose Us */}
          <div className="bg-gradient-to-br from-purple-600 to-pink-500 rounded-3xl p-8 md:p-12 text-white">
            <h2 className="text-3xl font-bold mb-8 text-center">Why Choose SmartDhobi?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
                  <Users className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Trusted Network</h3>
                <p className="text-purple-100">
                  Connect with verified local professionals who care about your clothes
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
                  <Heart className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Passion for Quality</h3>
                <p className="text-purple-100">
                  Every garment treated with care and attention to detail
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
                  <Award className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Urban Convenience</h3>
                <p className="text-purple-100">
                  Modern solutions for busy lifestyles with doorstep service
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer/>
    </div>
  );
}

export default AboutUs;