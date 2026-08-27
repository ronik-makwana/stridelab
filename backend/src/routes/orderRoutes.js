import express from "express";
import {
  createRazorpayOrder,
  verifyPayment,
  getOrders,
  getOrder,
  getAllOrders,
  getOrderAdmin,
  updateOrderStatus,
  getDashboardStats,
} from "../controllers/orderController.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// Create Razorpay order
router.post("/razorpay/create-order", protect, createRazorpayOrder);

// Verify Razorpay payment and create order
router.post("/razorpay/verify", protect, verifyPayment);

// Get user's orders
router.get("/", protect, getOrders);

// Get a specific order
router.get("/:orderId", protect, getOrder);

// Admin routes
router.get("/admin/stats", protect, adminOnly, getDashboardStats);
router.get("/admin/all", protect, adminOnly, getAllOrders);
router.get("/admin/:orderId", protect, adminOnly, getOrderAdmin);
router.patch("/admin/:orderId/status", protect, adminOnly, updateOrderStatus);

export default router;
