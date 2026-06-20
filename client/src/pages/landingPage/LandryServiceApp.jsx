import React, { useState, useEffect } from "react";
import {
  MapPin,
  UserPlus,
  ArrowRight,
  Search,
  Star,
  Clock,
  Truck,
  Sparkles,
  Zap,
  Phone,
  Navigation,
  ShieldCheck,
  Wallet,
  CalendarCheck,
  Shirt,
  ChevronDown,
  ChevronUp,
  Flame,
} from "lucide-react";

import Modal from "../landingPage/components/Modal";
import CustomerRegistration from "../landingPage/auth/CustomerRegistration";
import DhobiRegistration from "../landingPage/auth/DhobiRegistration";
import Footer from "../../components/Footer";
import Navbar from "../../components/Navbar";
import { useNavigate } from "react-router-dom";

const faqs = [
  {
    q: "How long does ironing take?",
    a: "Standard service is completed within 24 hours.",
  },
  {
    q: "Do you offer express service?",
    a: "Yes, express service is available at an additional cost.",
  },
  {
    q: "How can I pay?",
    a: "You can pay online or via cash.",
  },
  {
    q: "What if my clothes are damaged?",
    a: "We work with verified vendors and ensure quality, but support is available for any issues.",
  },
  {
    q: "How do I book a dhobi?",
    a: "Simply register, enter your location, choose your service, and a nearby verified dhobi will be assigned to you.",
  },
  {
    q: "Is SmartDhobi available in my area?",
    a: "We are rapidly expanding across India. Enter your location to check service availability near you.",
  },
];

const services = [
  {
    emoji: "🧺",
    icon: Sparkles,
    title: "Wash & Fold",
    description:
      "Hassle-free washing and folding service for your everyday clothes. Clean, fresh, and neatly packed.",
    bullets: ["Machine wash", "Drying", "Folding"],
    cta: "Book Now",
    gradient: "from-blue-500 to-purple-600",
    bg: "from-blue-50 to-purple-50",
    border: "border-purple-100",
  },
  {
    emoji: "🧼",
    icon: Zap,
    title: "Dry Cleaning",
    description:
      "Professional care for delicate and premium garments using high-quality cleaning methods.",
    bullets: ["Suits", "Sarees", "Jackets"],
    cta: "Book Now",
    gradient: "from-green-500 to-blue-600",
    bg: "from-green-50 to-blue-50",
    border: "border-blue-100",
  },
  {
    emoji: "⚡",
    icon: Flame,
    title: "Express Service",
    description:
      "Need it urgently? Get your clothes cleaned and delivered within a few hours.",
    bullets: ["2–6 hours (based on location)"],
    cta: "Book Express",
    gradient: "from-orange-500 to-pink-600",
    bg: "from-orange-50 to-pink-50",
    border: "border-pink-100",
  },
  {
    emoji: "👕",
    icon: Shirt,
    title: "Ironing Service",
    description:
      "Crisp, wrinkle-free clothes with professional ironing by experienced dhobis.",
    bullets: ["Affordable pricing", "Skilled local dhobis", "Perfect finishing"],
    cta: "Book Now",
    gradient: "from-yellow-500 to-orange-500",
    bg: "from-yellow-50 to-orange-50",
    border: "border-orange-100",
    badge: "Core Service",
  },
];

const whyChoose = [
  {
    icon: ShieldCheck,
    title: "Verified Dhobis",
    desc: "Every dhobi on our platform is background-checked and quality-verified.",
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  {
    icon: CalendarCheck,
    title: "Easy Booking",
    desc: "Place an order in seconds — anytime, anywhere, right from your phone.",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    icon: Flame,
    title: "Fast Service",
    desc: "Quick turnaround times with express options available in your area.",
    color: "text-orange-500",
    bg: "bg-orange-50",
  },
  {
    icon: Wallet,
    title: "Transparent Pricing",
    desc: "No hidden charges. Know exactly what you pay before you book.",
    color: "text-green-600",
    bg: "bg-green-50",
  },
];

const howItWorks = [
  {
    number: "1",
    title: "Book Service",
    description: "Select your service and place an order in seconds",
    icon: CalendarCheck,
    color: "from-purple-500 to-pink-500",
  },
  {
    number: "2",
    title: "Dhobi Assigned",
    description: "A nearby verified dhobi accepts your request",
    icon: UserPlus,
    color: "from-blue-500 to-purple-500",
  },
  {
    number: "3",
    title: "Pickup & Service",
    description: "Clothes are collected and professionally handled",
    icon: Sparkles,
    color: "from-green-500 to-blue-500",
  },
  {
    number: "4",
    title: "Delivery",
    description: "Fresh, neatly pressed clothes delivered to your doorstep",
    icon: Truck,
    color: "from-pink-500 to-red-500",
  },
];

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={`border rounded-2xl overflow-hidden transition-all duration-300 ${
        open ? "border-purple-300 shadow-md" : "border-gray-100"
      } bg-white`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-5 text-left"
      >
        <span className="font-semibold text-gray-800 text-base">{q}</span>
        {open ? (
          <ChevronUp size={20} className="text-purple-500 shrink-0" />
        ) : (
          <ChevronDown size={20} className="text-gray-400 shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-6 pb-5 text-gray-600 text-sm leading-relaxed border-t border-gray-50 pt-3">
          {a}
        </div>
      )}
    </div>
  );
}

export default function SmartDhobiApp() {
  const [showRegister, setShowRegister] = useState(false);
  const [userType, setUserType] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [nearbyServices, setNearbyServices] = useState([]);
  const [animatedIcons, setAnimatedIcons] = useState({
    wash: false,
    delivery: false,
    star: false,
  });
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedIcons({ wash: true, delivery: true, star: true });
    }, 500);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setNearbyServices([
            { id: 1, name: "Quick Wash Dhobi", distance: "0.8 km", rating: 4.8, time: "2 hrs" },
            { id: 2, name: "Premium Laundry", distance: "1.2 km", rating: 4.9, time: "3 hrs" },
            { id: 3, name: "Express Clean", distance: "1.5 km", rating: 4.7, time: "1.5 hrs" },
          ]);
        },
        () => {
          setNearbyServices([
            { id: 1, name: "Quick Wash Dhobi", distance: "0.8 km", rating: 4.8, time: "2 hrs" },
            { id: 2, name: "Premium Laundry", distance: "1.2 km", rating: 4.9, time: "3 hrs" },
          ]);
        }
      );
    }

    return () => clearTimeout(timer);
  }, []);

  const handleLoginClick = () => navigate("/login");

  const handleRegisterClick = (type) => {
    setUserType(type);
    if (type === "vendor") {
      navigate("/dhobi-register");
    }
    setShowRegister(true);
  };

  const closeModals = () => setShowRegister(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Navbar */}
      <Navbar
        handleLoginClick={handleLoginClick}
        handleRegisterClick={handleRegisterClick}
        isMenuOpen={isMenuOpen}
      />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-32 h-32 bg-purple-200 rounded-full opacity-20 animate-pulse" />
          <div className="absolute bottom-20 right-10 w-24 h-24 bg-pink-200 rounded-full opacity-20 animate-bounce" />
          <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-yellow-200 rounded-full opacity-20 animate-ping" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            {/* Title */}
            <div className="mb-2">
              <h1 className="text-5xl md:text-7xl font-bold">
                <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-purple-800 bg-clip-text text-transparent">
                  Smart Dhobi
                </span>
              </h1>
            </div>

            {/* Tagline */}
            <p className="text-xl md:text-2xl font-semibold text-purple-500 mb-2 tracking-wide">
              "Smart Press, Bina Stress"
            </p>

            <p className="text-lg md:text-xl text-gray-600 mb-2">
              Premium Laundry Services At Your Doorstep
            </p>

            {/* Trust line */}
            <p className="text-sm text-gray-400 mb-8 tracking-widest uppercase font-medium">
              Trusted by Local Dhobis &nbsp;|&nbsp; Easy Booking &nbsp;|&nbsp; Affordable Prices
            </p>

            {/* Location Finder */}
            <div className="mb-8">
              <div className="max-w-md mx-auto">
                <div className="flex items-center bg-white rounded-full shadow-lg border-2 border-purple-100 p-2">
                  <MapPin className="text-purple-500 ml-4" size={20} />
                  <input
                    type="text"
                    placeholder="Enter your location"
                    className="flex-1 px-4 py-3 outline-none text-gray-700"
                  />
                  <button
                    id="search-btn"
                    className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-6 py-3 rounded-full hover:shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center space-x-2"
                  >
                    <Search size={18} />
                    <span>Find</span>
                  </button>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-6">
              {/* Book Now — primary */}
              <button
                onClick={() => handleRegisterClick("customer")}
                className="group bg-gradient-to-r from-purple-600 to-pink-500 text-white px-10 py-4 rounded-full text-lg font-bold hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center space-x-3"
              >
                <span>Book Now</span>
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => handleRegisterClick("customer")}
                className="group bg-white text-purple-600 border-2 border-purple-200 px-8 py-4 rounded-full text-lg font-semibold hover:bg-purple-50 hover:shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center space-x-3"
              >
                <UserPlus size={22} className="group-hover:rotate-12 transition-transform" />
                <span>Register as Customer</span>
              </button>

              <button
                onClick={() => handleRegisterClick("vendor")}
                className="group bg-white text-purple-600 border-2 border-purple-200 px-8 py-4 rounded-full text-lg font-semibold hover:bg-purple-50 hover:shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center space-x-3"
              >
                <Sparkles size={22} className="group-hover:rotate-12 transition-transform" />
                <span>Register as Dhobi</span>
              </button>
            </div>

            {/* Impact line */}
            <p className="text-base text-purple-400 font-medium italic mb-12">
              💡 Supporting Local Dhobis with Technology
            </p>

            {/* Features Preview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {[
                { icon: Sparkles, label: "Professional Cleaning", sub: "Expert dhobis with years of experience", anim: animatedIcons.wash ? "animate-spin" : "", grad: "from-blue-500 to-purple-600" },
                { icon: Truck, label: "Doorstep Service", sub: "Free pickup and delivery at your convenience", anim: animatedIcons.delivery ? "animate-bounce" : "", grad: "from-green-500 to-blue-600" },
                { icon: Star, label: "5-Star Quality", sub: "Guaranteed satisfaction with every order", anim: animatedIcons.star ? "animate-pulse" : "", grad: "from-yellow-500 to-pink-600" },
              ].map((f, i) => (
                <div key={i} className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-purple-100 hover:shadow-lg transition-all duration-300 group">
                  <div className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-br ${f.grad} rounded-full flex items-center justify-center transform transition-transform duration-500 ${f.anim} group-hover:scale-110`}>
                    <f.icon className="text-white w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">{f.label}</h3>
                  <p className="text-gray-600">{f.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── NEARBY SERVICES ── */}
      <section id="nearby" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              <Navigation className="inline-block mr-3 text-purple-600" size={40} />
              Nearby Dhobi Services
            </h2>
            <p className="text-lg text-gray-600">Professional laundry services in your area</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {nearbyServices.map((service) => (
              <div key={service.id} className="bg-gradient-to-br from-white to-purple-50 rounded-2xl p-6 border border-purple-100 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">{service.name}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center">
                        <MapPin size={14} className="mr-1 text-purple-500" />{service.distance}
                      </span>
                      <span className="flex items-center">
                        <Clock size={14} className="mr-1 text-green-500" />{service.time}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center bg-yellow-100 px-2 py-1 rounded-full">
                    <Star size={14} className="text-yellow-500 mr-1" />
                    <span className="text-sm font-semibold text-yellow-700">{service.rating}</span>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button className="flex-1 bg-gradient-to-r from-purple-600 to-pink-500 text-white py-2 px-4 rounded-lg hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                    Book Now
                  </button>
                  <button className="px-4 py-2 border border-purple-200 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors">
                    <Phone size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section id="services" className="py-20 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Premium Services</h2>
            <p className="text-lg text-gray-600">Professional laundry solutions for every need</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((svc, i) => (
              <div key={i} className={`group relative bg-gradient-to-br ${svc.bg} rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105 border ${svc.border}`}>
                {svc.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md whitespace-nowrap">
                    ⭐ {svc.badge}
                  </div>
                )}
                <div className={`w-16 h-16 mx-auto mb-5 bg-gradient-to-br ${svc.gradient} rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-300`}>
                  <svc.icon className="text-white w-8 h-8" />
                </div>
                <div className="text-3xl text-center mb-2">{svc.emoji}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">{svc.title}</h3>
                <p className="text-gray-600 text-sm text-center mb-4">{svc.description}</p>
                <ul className="text-sm text-gray-500 mb-6 space-y-1">
                  {svc.bullets.map((b, j) => (
                    <li key={j} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
                <button className={`w-full bg-gradient-to-r ${svc.gradient} text-white py-2.5 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 text-sm`}>
                  {svc.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How SmartDhobi Works</h2>
            <p className="text-lg text-gray-600">Simple steps to get your laundry done professionally</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {howItWorks.map((step, index) => (
              <div key={index} className="relative group">
                <div className="text-center">
                  <div className={`w-20 h-20 mx-auto mb-6 bg-gradient-to-br ${step.color} rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <step.icon className="text-white w-10 h-10" />
                  </div>
                  <div className="absolute top-0 left-1/2 -translate-x-10 -translate-y-2 w-8 h-8 bg-white border-4 border-purple-200 rounded-full flex items-center justify-center text-sm font-bold text-purple-600 shadow">
                    {step.number}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-600 text-sm">{step.description}</p>
                </div>
                {index < 3 && (
                  <div className="hidden md:block absolute top-10 left-full w-full">
                    <ArrowRight className="text-purple-300 w-8 h-8 mx-auto animate-bounce" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY CHOOSE SMARTDHOBI ── */}
      <section id="why-us" className="py-20 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">⭐ Why Choose SmartDhobi?</h2>
            <p className="text-lg text-gray-600">We make laundry care easy, reliable, and affordable</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {whyChoose.map((item, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-gray-100 text-center">
                <div className={`w-14 h-14 mx-auto mb-4 ${item.bg} rounded-full flex items-center justify-center`}>
                  <item.icon size={26} className={item.color} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ABOUT / COMPANY ── */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">About SmartDhobi</h2>
          <p className="text-gray-600 text-lg leading-relaxed mb-6">
            SmartDhobi is a technology-driven platform focused on simplifying everyday laundry and
            ironing services. We connect customers with trusted local dhobis, bringing convenience,
            transparency, and efficiency to a traditionally unorganized industry.
          </p>
          <p className="text-gray-600 text-lg leading-relaxed mb-6">
            Our goal is to make garment care easy and stress-free through digital booking, reliable
            service, and seamless payments. At the same time, we empower local vendors by providing
            them with the tools and opportunities to grow their business in a modern, competitive
            environment.
          </p>
          <p className="text-gray-600 text-lg leading-relaxed mb-8">
            With a strong focus on quality, affordability, and customer satisfaction, SmartDhobi
            aims to redefine how laundry services are accessed and delivered across India.
          </p>
          <div className="inline-block bg-gradient-to-r from-purple-600 to-pink-500 text-white px-8 py-3 rounded-full font-semibold text-lg shadow-lg">
            💡 Supporting Local Dhobis with Technology
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-20 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-gray-600">Everything you need to know about SmartDhobi</p>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <FAQItem key={i} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* Modals */}
      {showRegister && (
        <Modal
          title={`${userType === "vendor" ? "Dhobi" : "Customer"} Registration`}
          onClose={closeModals}
        >
          {userType === "vendor" ? <DhobiRegistration /> : <CustomerRegistration />}
        </Modal>
      )}

      <Footer />
    </div>
  );
}