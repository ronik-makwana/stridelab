import express from "express";
import { getAnalytics } from "../controllers/analyticsController.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get analytics (Admin only)
router.get("/", protect, adminOnly, getAnalytics);

export default router;

