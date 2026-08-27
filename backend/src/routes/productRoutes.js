import express from "express";
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  addReview,
  getReviews,
  searchProducts,
} from "../controllers/productController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.get("/search", searchProducts);
router.get("/", getProducts);
router.get("/:id/reviews", getReviews);
router.get("/:id", getProduct);

// Protected routes (admin only - you can add admin check middleware if needed)
router.post("/", protect, createProduct);
router.post("/:id/reviews", protect, addReview);
router.put("/:id", protect, updateProduct);
router.delete("/:id", protect, deleteProduct);

export default router;

