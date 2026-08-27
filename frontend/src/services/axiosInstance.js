import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URI || "http://localhost:5050/api",
  withCredentials: true,
});

console.log(import.meta.env.VITE_API_URI);
console.log(import.meta.env.VITE_RAZORPAY_KEY_ID);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.data?.message) {
      error.message = error.response.data.message;
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
