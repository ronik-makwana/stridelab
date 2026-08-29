import axiosInstance from "./axiosInstance.js";

export const registerUser = (payload) =>
  axiosInstance.post("/auth/register", payload);

export const loginUser = (payload) =>
  axiosInstance.post("/auth/login", payload);

export const logoutUser = () => axiosInstance.post("/auth/logout");

export const logoutAllDevices = () => axiosInstance.post("/auth/logout-all");

export const refreshSession = () => axiosInstance.post("/auth/refresh");

export const checkAuth = () => axiosInstance.get("/auth/check-auth");

export const updateProfile = (payload) =>
  axiosInstance.put("/auth/profile", payload);

export const changePassword = (payload) =>
  axiosInstance.put("/auth/change-password", payload);

