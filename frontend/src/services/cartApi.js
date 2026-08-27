import axiosInstance from "./axiosInstance.js";

export const getCart = () => axiosInstance.get("/cart");

export const addToCart = (productId, quantity, size, color) =>
  axiosInstance.post("/cart", { productId, quantity, size, color });

export const updateCartItem = (itemId, quantity) =>
  axiosInstance.put(`/cart/${itemId}`, { quantity });

export const removeFromCart = (itemId) =>
  axiosInstance.delete(`/cart/${itemId}`);

export const clearCart = () => axiosInstance.delete("/cart");

