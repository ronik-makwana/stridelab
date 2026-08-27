import axiosInstance from "./axiosInstance.js";

export const getProducts = (filters = {}) => {
  const params = {};
  
  if (filters.category && filters.category !== "all") {
    params.category = filters.category;
  }
  
  if (filters.collection && filters.collection !== "all") {
    params.collection = filters.collection;
  }
  
  if (filters.search && filters.search.trim()) {
    params.search = filters.search.trim();
  }
  
  if (filters.page) {
    params.page = filters.page;
  }
  
  return axiosInstance.get("/products", { params });
};

export const getProduct = (id) => axiosInstance.get(`/products/${id}`);

export const createProduct = (payload) =>
  axiosInstance.post("/products", payload);

export const updateProduct = (id, payload) =>
  axiosInstance.put(`/products/${id}`, payload);

export const deleteProduct = (id) => axiosInstance.delete(`/products/${id}`);

// Review APIs
export const getReviews = (productId, sort = "recent") =>
  axiosInstance.get(`/products/${productId}/reviews`, {
    params: { sort },
  });

export const addReview = (productId, payload) =>
  axiosInstance.post(`/products/${productId}/reviews`, payload);

// Search products
export const searchProducts = (query, page = 1, filters = {}) => {
  const params = { q: query, page };

  // Add filter parameters - send arrays as comma-separated strings
  if (filters.priceRanges && filters.priceRanges.length > 0) {
    params.priceRanges = filters.priceRanges.join(",");
  }
  if (filters.discountRanges && filters.discountRanges.length > 0) {
    params.discountRanges = filters.discountRanges.join(",");
  }
  if (filters.colors && filters.colors.length > 0) {
    params.colors = filters.colors.join(",");
  }
  if (filters.sizes && filters.sizes.length > 0) {
    params.sizes = filters.sizes.join(",");
  }
  if (filters.sortBy) {
    params.sortBy = filters.sortBy;
  }

  return axiosInstance.get("/products/search", { params });
};
