import express from "express";
import {
  getCollections,
  getCollection,
  createCollection,
  updateCollection,
  deleteCollection,
} from "../controllers/collectionController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.get("/", getCollections);
router.get("/:id", getCollection);

// Protected routes (admin only - you can add admin check middleware if needed)
router.post("/", protect, createCollection);
router.put("/:id", protect, updateCollection);
router.delete("/:id", protect, deleteCollection);

export default router;
