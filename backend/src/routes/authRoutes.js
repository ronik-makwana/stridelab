import express from "express";
import {
  register,
  login,
  refresh,
  logout,
  logoutAll,
  checkAuth,
  updateProfile,
  changePassword,
  getAllUsers,
} from "../controllers/authController.js";
import protect, { adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.post("/logout-all", protect, logoutAll);
router.get("/check-auth", protect, checkAuth);
router.put("/profile", protect, updateProfile);
router.put("/change-password", protect, changePassword);

// Admin routes
router.get("/admin/users", protect, adminOnly, getAllUsers);

export default router;
