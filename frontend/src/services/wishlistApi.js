import axiosInstance from "./axiosInstance.js";

export const getWishlist = () => axiosInstance.get("/wishlist");

export const addToWishlist = (productId) =>
  axiosInstance.post("/wishlist", { productId });

export const removeFromWishlist = (productId) =>
  axiosInstance.delete(`/wishlist/${productId}`);

export const checkWishlist = (productId) =>
  axiosInstance.get(`/wishlist/check/${productId}`);

