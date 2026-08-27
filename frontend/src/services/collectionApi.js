import axiosInstance from "./axiosInstance.js";

export const getCollections = (page = 1, search = "", type = null) => {
  const params = { page };
  if (search.trim()) {
    params.search = search.trim();
  }
  if (type) {
    params.type = type;
  }
  return axiosInstance.get("/collections", { params });
};

export const getCollection = (id, page = 1, filters = {}) => {
  const params = { page };

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

  return axiosInstance.get(`/collections/${id}`, { params });
};

export const createCollection = (payload) =>
  axiosInstance.post("/collections", payload);

export const updateCollection = (id, payload) =>
  axiosInstance.put(`/collections/${id}`, payload);

export const deleteCollection = (id) =>
  axiosInstance.delete(`/collections/${id}`);
