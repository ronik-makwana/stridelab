import axiosInstance from "./axiosInstance.js";

// Create Razorpay order
export const createRazorpayOrder = (amount) =>
  axiosInstance.post("/orders/razorpay/create-order", { amount });

// Verify Razorpay payment and create order
export const verifyRazorpayPayment = (paymentData) =>
  axiosInstance.post("/orders/razorpay/verify", paymentData);

// Get user's orders with pagination, search, and status filter
export const getOrders = (page = 1, search = "", status = null, limit = 10) => {
  const params = { page, limit };
  if (search.trim()) {
    params.search = search.trim();
  }
  if (status && status !== "all") {
    params.status = status;
  }
  return axiosInstance.get("/orders", { params });
};

// Get a specific order by ID
export const getOrder = (orderId) => axiosInstance.get(`/orders/${orderId}`);

// Get all orders (Admin only) with pagination, search, and status filter
export const getAllOrders = (page = 1, search = "", status = null) => {
  const params = { page };
  if (search.trim()) {
    params.search = search.trim();
  }
  if (status && status !== "all") {
    params.status = status;
  }
  return axiosInstance.get("/orders/admin/all", { params });
};

// Get a specific order by ID (Admin only)
export const getOrderAdmin = (orderId) =>
  axiosInstance.get(`/orders/admin/${orderId}`);

// Update order status (Admin only)
export const updateOrderStatus = (orderId, status) =>
  axiosInstance.patch(`/orders/admin/${orderId}/status`, { status });

// Get dashboard statistics (Admin only)
export const getDashboardStats = () => axiosInstance.get("/orders/admin/stats");
