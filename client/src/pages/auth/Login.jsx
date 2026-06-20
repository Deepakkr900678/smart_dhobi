// import React, { useState } from "react";
// import {
//   Lock,
//   Mail,
//   AlertCircle,
//   Eye,
//   EyeOff,
//   Sparkles,
//   ArrowRight,
//   Shield,
// } from "lucide-react";
// import logo from "../../assets/logo.png";
// import { useNavigate } from "react-router-dom";
// import { loginUser } from "../../auth/ApiConnect";
// import { useToast } from "../../components/toast/ToastProvider";
// import { getApiErrorMessage } from "../../utils/apiError";

// const Login = () => {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [showPassword, setShowPassword] = useState(false);
//   const navigate = useNavigate();
//   const { showToast } = useToast();

//   // Function to get navigation path based on role
//   const getNavigationPath = (role) => {
//     switch (role) {
//       case "admin":
//         return "/admin";
//       case "dhobi":
//         return "/dhobi";
//       case "user":
//       case "customer":
//         return "/customer";
//       default:
//         return "/";
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError("");
//     setLoading(true);

//     try {
//       const response = await loginUser({ email, password });

//       // Check if response is successful
//       if (response && response.token && response.user) {
//         // Store data in localStorage
//         localStorage.setItem("token", response.token);
//         localStorage.setItem("user", JSON.stringify(response.user));
//         localStorage.setItem("role", response.user.role);
//         localStorage.setItem("mainUserId", response.mainUserId);

//         // Wait a moment to ensure localStorage is updated
//         await new Promise((resolve) => setTimeout(resolve, 100));

//         // Get the navigation path based on role
//         const navigationPath = getNavigationPath(response.user.role);

//         showToast({
//           type: "success",
//           title: "Login successful",
//           message: response.message || "Welcome back to Smart Dhobi.",
//         });

//         // Navigate to the appropriate dashboard
//         navigate(navigationPath, { replace: true });
//       } else {
//         // Handle error response
//         const message =
//           response?.message || "Login failed. Please check your credentials.";
//         setError(message);
//         showToast({
//           type: "error",
//           title: "Login failed",
//           message,
//         });
//       }
//     } catch (err) {
//       console.error("Login error:", err);
//       const message = getApiErrorMessage(
//         err,
//         "An error occurred. Please try again."
//       );
//       setError(message);
//       showToast({
//         type: "error",
//         title: "Login failed",
//         message,
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const togglePasswordVisibility = () => {
//     setShowPassword(!showPassword);
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center p-4">
//       {/* Background Animation */}
//       <div className="absolute inset-0 overflow-hidden">
//         <div className="absolute top-20 left-10 w-32 h-32 bg-purple-200 rounded-full opacity-20 animate-pulse"></div>
//         <div className="absolute bottom-20 right-10 w-24 h-24 bg-pink-200 rounded-full opacity-20 animate-bounce"></div>
//         <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-yellow-200 rounded-full opacity-20 animate-ping"></div>
//       </div>

//       <div className="relative w-full p-8">
//         {/* Login Card */}
//         <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-purple-100 overflow-hidden flex w-full">
//           {/* Header Section */}
//           <div className="bg-gradient-to-r from-purple-600 to-pink-500 p-4 text-center relative w-full">
//             <div className="absolute inset-0 bg-black/10"></div>
//             <div className="relative z-10">
//               {/* Logo */}
//               <div className="flex items-center justify-center">
//                 <img
//                   src={logo}
//                   alt="Smart Dhobi Logo"
//                   className="w-[60%] h-[60%] transition-transform duration-300 ease-in-out hover:scale-125 cursor-pointer"
//                   onClick={() => {
//                     navigate("/");
//                   }}
//                 />
//               </div>

//               {/* Decorative Elements */}
//               <div className="absolute top-4 right-4 w-8 h-8 bg-white/20 rounded-full animate-bounce"></div>
//               <div className="absolute bottom-4 left-4 w-6 h-6 bg-white/20 rounded-full animate-pulse"></div>
//             </div>
//           </div>

//           {/* Form Section */}
//           <div className="p-8 w-full">
//             <div className="text-center mb-8">
//               <h3 className="text-2xl font-bold text-gray-900 mb-2">
//                 Welcome Back
//               </h3>
//               <p className="text-gray-600">Sign in to access your dashboard</p>
//             </div>

//             {/* Error Alert */}
//             {error && (
//               <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 animate-in fade-in slide-in-from-top-2 duration-300">
//                 <div className="flex items-center">
//                   <div className="flex-shrink-0">
//                     <AlertCircle className="text-red-500 w-5 h-5" />
//                   </div>
//                   <div className="ml-3">
//                     <p className="text-red-800 text-sm font-medium">{error}</p>
//                   </div>
//                 </div>
//               </div>
//             )}

//             {/* Login Form */}
//             <form onSubmit={handleSubmit} className="space-y-6">
//               {/* Email Field */}
//               <div className="group">
//                 <label className="block text-sm font-semibold text-gray-700 mb-2">
//                   Email Address
//                 </label>
//                 <div className="relative">
//                   <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
//                     <Mail className="text-gray-400 group-focus-within:text-purple-500 w-5 h-5 transition-colors duration-200" />
//                   </div>
//                   <input
//                     type="email"
//                     required
//                     className="block w-full pl-12 pr-4 py-4 text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200 bg-gray-50 focus:bg-white group-hover:border-purple-300"
//                     placeholder="admin@dhobi.com"
//                     value={email}
//                     onChange={(e) => setEmail(e.target.value)}
//                   />
//                 </div>
//               </div>

//               {/* Password Field */}
//               <div className="group">
//                 <label className="block text-sm font-semibold text-gray-700 mb-2">
//                   Password
//                 </label>
//                 <div className="relative">
//                   <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
//                     <Lock className="text-gray-400 group-focus-within:text-purple-500 w-5 h-5 transition-colors duration-200" />
//                   </div>
//                   <input
//                     type={showPassword ? "text" : "password"}
//                     required
//                     className="block w-full pl-12 pr-12 py-4 text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200 bg-gray-50 focus:bg-white group-hover:border-purple-300"
//                     placeholder="••••••••"
//                     value={password}
//                     onChange={(e) => setPassword(e.target.value)}
//                   />
//                   <button
//                     type="button"
//                     onClick={togglePasswordVisibility}
//                     className="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-gray-50 rounded-r-xl transition-colors duration-200"
//                   >
//                     {showPassword ? (
//                       <EyeOff className="text-gray-400 hover:text-purple-500 w-5 h-5 transition-colors duration-200" />
//                     ) : (
//                       <Eye className="text-gray-400 hover:text-purple-500 w-5 h-5 transition-colors duration-200" />
//                     )}
//                   </button>
//                 </div>
//               </div>

//               {/* Remember Me & Forgot Password */}
//               <div className="flex items-center justify-between">
//                 <div className="text-sm">
//                   <button
//                     type="button"
//                     className="font-semibold text-purple-600 hover:text-purple-500 transition-colors duration-200"
//                   >
//                     Forgot password?
//                   </button>
//                 </div>
//               </div>

//               {/* Submit Button */}
//               <button
//                 type="submit"
//                 disabled={loading || !email || !password}
//                 className="group relative w-full flex justify-center items-center py-4 px-6 border border-transparent text-base font-semibold rounded-xl text-white bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
//               >
//                 {loading ? (
//                   <>
//                     <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
//                     Signing in...
//                   </>
//                 ) : (
//                   <>
//                     <Shield className="w-5 h-5 mr-3 group-hover:rotate-12 transition-transform duration-300" />
//                     Sign in to Dashboard
//                     <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform duration-300" />
//                   </>
//                 )}
//               </button>
//             </form>

//             {/* Footer Links */}
//             <div className="mt-8 text-center">
//               <p className="text-sm text-gray-600">
//                 Need help?{" "}
//                 <a
//                   href="#"
//                   className="font-semibold text-purple-600 hover:text-purple-500 transition-colors duration-200"
//                 >
//                   Contact Support
//                 </a>
//               </p>
//             </div>
//           </div>
//         </div>

//         {/* Security Badge */}
//         <div className="mt-6 text-center">
//           <div className="inline-flex items-center px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-gray-200">
//             <Shield className="w-4 h-4 text-green-500 mr-2" />
//             <span className="text-xs text-gray-600 font-medium">
//               Secure Access
//             </span>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Login;

import React, { useState } from "react";
import {
  Lock,
  Mail,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
} from "lucide-react";
import logo from "../../assets/logo.png";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../../auth/ApiConnect";
import { useToast } from "../../components/toast/ToastProvider";
import { getApiErrorMessage } from "../../utils/apiError";
import socket from "../../socket";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const getNavigationPath = (role) => {
    switch (role) {
      case "admin":
        return "/admin";
      case "dhobi":
        return "/dhobi";
      case "user":
      case "customer":
        return "/customer";
      default:
        return "/";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await loginUser({ email, password });

      if (response?.token && response?.user) {
        localStorage.setItem("token", response.token);
        localStorage.setItem("user", JSON.stringify(response.user));
        localStorage.setItem("role", response.user.role);
        localStorage.setItem("mainUserId", response.mainUserId);

        // Connect socket and join user room right after login
        socket.connect();
        socket.emit("join", response.user._id);

        showToast({
          type: "success",
          title: "Login successful",
          message: response.message || "Welcome back to Smart Dhobi.",
        });

        navigate(getNavigationPath(response.user.role), { replace: true });
      } else {
        const message =
          response?.message || "Login failed. Please check your credentials.";
        setError(message);
        showToast({ type: "error", title: "Login failed", message });
      }
    } catch (err) {
      const message = getApiErrorMessage(
        err,
        "An error occurred. Please try again."
      );
      setError(message);
      showToast({ type: "error", title: "Login failed", message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-32 h-32 bg-purple-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-24 h-24 bg-pink-200 rounded-full opacity-20 animate-bounce"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-yellow-200 rounded-full opacity-20 animate-ping"></div>
      </div>

      <div className="relative w-full p-8">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-purple-100 overflow-hidden flex w-full">
          {/* Branding panel */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-500 p-4 text-center relative w-full">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-center">
                <img
                  src={logo}
                  alt="Smart Dhobi Logo"
                  className="w-[60%] h-[60%] transition-transform duration-300 ease-in-out hover:scale-125 cursor-pointer"
                  onClick={() => navigate("/")}
                />
              </div>
              <div className="absolute top-4 right-4 w-8 h-8 bg-white/20 rounded-full animate-bounce"></div>
              <div className="absolute bottom-4 left-4 w-6 h-6 bg-white/20 rounded-full animate-pulse"></div>
            </div>
          </div>

          {/* Form panel */}
          <div className="p-8 w-full">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome Back
              </h3>
              <p className="text-gray-600">Sign in to access your dashboard</p>
            </div>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center">
                  <AlertCircle className="text-red-500 w-5 h-5 flex-shrink-0" />
                  <p className="text-red-800 text-sm font-medium ml-3">
                    {error}
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="text-gray-400 w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    required
                    className="block w-full pl-12 pr-4 py-4 text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200 bg-gray-50 focus:bg-white group-hover:border-purple-300"
                    placeholder="admin@dhobi.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="text-gray-400 w-5 h-5" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    className="block w-full pl-12 pr-12 py-4 text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200 bg-gray-50 focus:bg-white group-hover:border-purple-300"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-gray-50 rounded-r-xl"
                  >
                    {showPassword ? (
                      <EyeOff className="text-gray-400 hover:text-purple-500 w-5 h-5" />
                    ) : (
                      <Eye className="text-gray-400 hover:text-purple-500 w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  className="text-sm font-semibold text-purple-600 hover:text-purple-500"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading || !email || !password}
                className="group relative w-full flex justify-center items-center py-4 px-6 border border-transparent text-base font-semibold rounded-xl text-white bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
                    Signing in...
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5 mr-3 group-hover:rotate-12 transition-transform duration-300" />
                    Sign in to Dashboard
                    <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform duration-300" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                Need help?{" "}
                <a
                  href="#"
                  className="font-semibold text-purple-600 hover:text-purple-500"
                >
                  Contact Support
                </a>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-gray-200">
            <Shield className="w-4 h-4 text-green-500 mr-2" />
            <span className="text-xs text-gray-600 font-medium">
              Secure Access
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
