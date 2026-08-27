import axiosInstance from "./axiosInstance.js";

// Get analytics data (Admin only)
export const getAnalytics = (period = "30") =>
  axiosInstance.get("/analytics", { params: { period } });

