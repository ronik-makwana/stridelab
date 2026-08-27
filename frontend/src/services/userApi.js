import axiosInstance from "./axiosInstance.js";

// Get all users (Admin only) with pagination and search
export const getAllUsers = (page = 1, search = "") => {
  const params = { page };
  if (search.trim()) {
    params.search = search.trim();
  }
  return axiosInstance.get("/auth/admin/users", { params });
};
