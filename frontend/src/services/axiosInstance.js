import axios from "axios";

import useAuthStore from "../store/authStore.js";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URI || "http://localhost:5050/api",
  withCredentials: true,
});

// Endpoints that must never trigger a refresh attempt, either because they
// are the refresh call itself or because a 401 there is the real answer.
const AUTH_ENDPOINTS = [
  "/auth/login",
  "/auth/register",
  "/auth/refresh",
  "/auth/logout",
];

const isAuthEndpoint = (url = "") =>
  AUTH_ENDPOINTS.some((endpoint) => url.includes(endpoint));

// The startup session probe: a failure there just means "not logged in",
// so it must not bounce anonymous visitors to the login page.
const isSessionProbe = (url = "") => url.includes("/auth/check-auth");

// Only one refresh call is in flight at a time; everything else waits on it.
let refreshPromise = null;

const refreshSession = () => {
  if (!refreshPromise) {
    refreshPromise = axiosInstance
      .post("/auth/refresh")
      .then(({ data }) => {
        useAuthStore.getState().setUser(data?.user ?? null);
        return data;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

const handleSessionExpired = () => {
  useAuthStore.getState().clearUser();

  const { pathname } = window.location;
  if (pathname !== "/login" && pathname !== "/register") {
    window.location.href = "/login";
  }
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.data?.message) {
      error.message = error.response.data.message;
    }

    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthEndpoint(originalRequest.url)
    ) {
      originalRequest._retry = true;

      try {
        await refreshSession();
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        if (isSessionProbe(originalRequest.url)) {
          useAuthStore.getState().clearUser();
        } else {
          handleSessionExpired();
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
