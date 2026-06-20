import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_APP_BASE_URL || "http://localhost:8000/api";

const getStoredUser = () => {
  const storedUser = localStorage.getItem("user");
  return storedUser ? JSON.parse(storedUser) : null;
};

export const getAuthConfig = () => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
};

export const getCurrentUserId = () => getStoredUser()?._id || null;
export const getCurrentRole = () => getStoredUser()?.role || null;
export const getCurrentMainUserId = () =>
  localStorage.getItem("mainUserId") || getCurrentUserId();

export const userId = getCurrentUserId();
export const role = getCurrentRole();
export const mainUserId = getCurrentMainUserId();

// ── Auth ──────────────────────────────────────────────────────────────────────

export const registerUser = async (userData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/register`, userData, {
      headers: { "Content-Type": "application/json" },
    });
    return response.data;
  } catch (error) {
    console.error("Error registering user:", error);
    throw error;
  }
};

export const verifyUserOtp = async (payload) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/verify-otp`, payload, {
      headers: { "Content-Type": "application/json" },
    });
    return response.data;
  } catch (error) {
    console.error("Error verifying OTP:", error);
    throw error;
  }
};

export const resendUserOtp = async (payload) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/resend-otp`, payload, {
      headers: { "Content-Type": "application/json" },
    });
    return response.data;
  } catch (error) {
    console.error("Error resending OTP:", error);
    throw error;
  }
};

export const loginUser = async (credentials) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials, {
      headers: { "Content-Type": "application/json" },
    });
    return response.data;
  } catch (error) {
    console.error("Error logging in user:", error);
    throw error;
  }
};

// ── Providers ─────────────────────────────────────────────────────────────────

export const registreDhobi = async (newVendor) => {
  try {
    newVendor.pricing = {};
    newVendor.mobile = String(newVendor.mobile); // ensure string
    newVendor.services.forEach((service) => {
      const serviceName = service.name.toLowerCase();
      const price = parseFloat(String(service.price).replace(/[^0-9.]/g, ""));
      newVendor.pricing[serviceName] = price;
    });

    const response = await axios.post(
      `${API_BASE_URL}/providers/create`,
      newVendor,
      getAuthConfig() // requires auth + admin
    );
    return response;
  } catch (err) {
    console.error("Error adding vendor:", err);
    throw err;
  }
};

// Public — no auth needed
export const getAllDhobis = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/providers`);
    return response.data.data; // backend returns { success, data, pagination }
  } catch (error) {
    console.error("Error fetching dhobis:", error);
    throw error;
  }
};

// Requires auth
export const fetchDhobiById = async (dhobiId) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/providers/profile/${dhobiId}`,
      getAuthConfig()
    );
    return response.data.data;
  } catch (error) {
    console.error("Error fetching dhobi by ID:", error);
    throw error;
  }
};

export const fetchCurrentUserProfile = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/users/profile`, getAuthConfig());
    return response.data.data;
  } catch (error) {
    console.error("Error fetching current user profile:", error);
    throw error;
  }
};

export const updateCurrentUserProfile = async (profileData) => {
  try {
    const response = await axios.patch(
      `${API_BASE_URL}/users/profile`,
      profileData,
      {
        headers: {
          "Content-Type": "application/json",
          ...getAuthConfig().headers,
        },
      }
    );
    return response.data.data;
  } catch (error) {
    console.error("Error updating current user profile:", error);
    throw error;
  }
};

export const updateDhobiProfile = async (dhobiId, profileData) => {
  try {
    const response = await axios.patch(
      `${API_BASE_URL}/providers/profile/${dhobiId}`,
      profileData,
      {
        headers: {
          "Content-Type": "application/json",
          ...getAuthConfig().headers,
        },
      }
    );
    return response.data.data;
  } catch (error) {
    console.error("Error updating dhobi profile:", error);
    throw error;
  }
};

export const addDhobiService = async (dhobiId, serviceData) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/providers/profile/${dhobiId}/services`,
      serviceData,
      getAuthConfig()
    );
    return response.data;
  } catch (error) {
    console.error("Error adding service:", error);
    throw error;
  }
};

export const updateDhobiService = async (dhobiId, serviceId, serviceData) => {
  try {
    const response = await axios.patch(
      `${API_BASE_URL}/providers/profile/${dhobiId}/services/${serviceId}`,
      serviceData,
      getAuthConfig()
    );
    return response.data;
  } catch (error) {
    console.error("Error updating service:", error);
    throw error;
  }
};

export const deleteDhobiService = async (dhobiId, serviceId) => {
  try {
    const response = await axios.delete(
      `${API_BASE_URL}/providers/profile/${dhobiId}/services/${serviceId}`,
      getAuthConfig()
    );
    return response.data;
  } catch (error) {
    console.error("Error deleting service:", error);
    throw error;
  }
};

// ── Users ─────────────────────────────────────────────────────────────────────

// Requires auth + admin
export const getAllUsers = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/admin/users`, getAuthConfig());
    return response.data;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

// ── Orders ────────────────────────────────────────────────────────────────────

export const saveOrder = async (orderData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/orders/create`, orderData, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthConfig().headers,
      },
    });
    return response.data.data;
  } catch (error) {
    console.error("Error saving order:", error);
    throw error;
  }
};

export const getOrderById = async (orderId) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/orders/${orderId}`,
      getAuthConfig()
    );
    return response.data.data;
  } catch (error) {
    console.error("Error fetching order by ID:", error);
    throw error;
  }
};

export const userOrders = async () => {
  try {
    const currentUserId = getCurrentUserId();
    if (!currentUserId) throw new Error("User ID not found");

    const response = await axios.get(
      `${API_BASE_URL}/orders/userOrders/${currentUserId}`,
      getAuthConfig()
    );
    return response.data.data;
  } catch (error) {
    console.error("Error fetching user orders:", error);
    throw error;
  }
};

export const getDhobiOrder = async () => {
  try {
    const currentUserId = getCurrentUserId();
    if (!currentUserId) throw new Error("Dhobi user ID not found");

    const response = await axios.get(
      `${API_BASE_URL}/orders/dhobiOrders/${currentUserId}`,
      getAuthConfig()
    );
    return response.data.data;
  } catch (error) {
    console.error("Error fetching dhobi orders:", error);
    throw error;
  }
};

export const getAllOrders = async () => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/orders/getAllOrders`,
      getAuthConfig()
    );
    return response.data.data;
  } catch (error) {
    console.error("Error fetching all orders:", error);
    throw error;
  }
};

export const getOrderManagment = async (page = 1, limit = 20) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/admin/orders?page=${page}&limit=${limit}`,
      getAuthConfig()
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching orders:", error);
    throw error;
  }
};

export const updateOrderByOrderId = async (orderId, status) => {
  try {
    const response = await axios.patch(
      `${API_BASE_URL}/orders/${orderId}/status`,
      { status },
      getAuthConfig()
    );
    return response.data.data;
  } catch (error) {
    console.error("Error updating order:", error);
    throw error;
  }
};

// ── Notifications ─────────────────────────────────────────────────────────────

export const fetchNotifications = async () => {
  try {
    const res = await axios.get(
      `${API_BASE_URL}/notification`,
      getAuthConfig()
    );
    return res.data?.data || [];
  } catch (err) {
    console.error("Error fetching notifications:", err);
    return [];
  }
};

export const updateNotificationClick = async (noti) => {
  try {
    const res = await axios.patch(
      `${API_BASE_URL}/notification/${noti._id}/read`,
      {},
      getAuthConfig()
    );
    return res.data;
  } catch (err) {
    console.error("Failed to mark notification as read", err);
    throw err;
  }
};

// ── Payments ──────────────────────────────────────────────────────────────────

export const createRazorpayOrder = async (order) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/orders/create-razorpay-order`,
      { orderId: order.orderId, amount: order.amount },
      {
        headers: {
          "Content-Type": "application/json",
          ...getAuthConfig().headers,
        },
      }
    );
  const { razorpayOrderId, key, amount, currency, order: paymentOrder } = response.data.data;
    return { razorpayOrderId, key, amount, currency, order: paymentOrder };
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    throw error;
  }
};

export const verifyPaymentSuccess = async (order, response) => {
  try {
    const verifyResponse = await axios.post(
      `${API_BASE_URL}/orders/verify-payment`,
      {
        orderId: order.orderId,
        razorpayPaymentId: response.razorpay_payment_id,
        razorpayOrderId: response.razorpay_order_id,
        razorpaySignature: response.razorpay_signature,
      },
      {
        headers: {
          "Content-Type": "application/json",
          ...getAuthConfig().headers,
        },
      }
    );
    return verifyResponse.data;
  } catch (error) {
    console.error("Error verifying payment:", error);
    throw error;
  }
};

// ── Admin ─────────────────────────────────────────────────────────────────────

export const getAdminDashboardData = async () => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/admin/dashboard`,
      getAuthConfig() // requires auth + admin
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching admin dashboard data:", error);
    throw error;
  }
};
