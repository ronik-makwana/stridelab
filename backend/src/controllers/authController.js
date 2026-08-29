import bcrypt from "bcryptjs";

import User from "../models/userModel.js";
import {
  REFRESH_TOKEN_COOKIE,
  signAccessToken,
  issueRefreshToken,
  verifyRefreshToken,
  findStoredRefreshToken,
  revokeRefreshToken,
  revokeAllRefreshTokens,
  setAuthCookies,
  clearAuthCookies,
} from "../utils/tokenUtils.js";
import {
  loginSchema,
  registerSchema,
  updateProfileSchema,
  changePasswordSchema,
} from "../validations/userValidation.js";

// Register
export const register = async (req, res) => {
  try {
    const parsedBody = registerSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(400).json({
        message: "Validation error",
        errors: parsedBody.error.flatten().fieldErrors,
      });
    }

    const { firstName, lastName, email, password } = parsedBody.data;

    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
    });

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Login
export const login = async (req, res) => {
  try {
    const parsedBody = loginSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(400).json({
        message: "Validation error",
        errors: parsedBody.error.flatten().fieldErrors,
      });
    }

    const { email, password } = parsedBody.data;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
      return res.status(400).json({ message: "Invalid credentials" });

    // Short-lived access token + long-lived rotating refresh token,
    // both in HTTP-only cookies
    const accessToken = signAccessToken(user);
    const refreshToken = await issueRefreshToken(user, req);
    setAuthCookies(res, accessToken, refreshToken);

    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Refresh — rotates the refresh token and issues a new access token
export const refresh = async (req, res) => {
  try {
    const token = req.cookies[REFRESH_TOKEN_COOKIE];
    if (!token) {
      clearAuthCookies(res);
      return res.status(401).json({ message: "No refresh token" });
    }

    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      clearAuthCookies(res);
      return res
        .status(401)
        .json({ message: "Refresh token invalid or expired" });
    }

    const stored = await findStoredRefreshToken(token);

    // A valid signature with no live record means the token was already
    // rotated or revoked — treat it as reuse and drop every session.
    if (!stored || stored.revokedAt) {
      await revokeAllRefreshTokens(payload.id);
      clearAuthCookies(res);
      return res.status(401).json({ message: "Refresh token reuse detected" });
    }

    if (stored.expiresAt <= new Date()) {
      await revokeRefreshToken(token);
      clearAuthCookies(res);
      return res.status(401).json({ message: "Refresh token expired" });
    }

    const user = await User.findById(payload.id).select("-password");
    if (!user) {
      await revokeAllRefreshTokens(payload.id);
      clearAuthCookies(res);
      return res.status(401).json({ message: "User no longer exists" });
    }

    // Rotate: the presented token is retired and replaced
    await revokeRefreshToken(token);
    const accessToken = signAccessToken(user);
    const newRefreshToken = await issueRefreshToken(user, req);
    setAuthCookies(res, accessToken, newRefreshToken);

    res.json({
      message: "Token refreshed",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Logout — revokes the current session's refresh token
export const logout = async (req, res) => {
  try {
    const token = req.cookies[REFRESH_TOKEN_COOKIE];
    if (token) await revokeRefreshToken(token);

    clearAuthCookies(res);
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Logout from every device — revokes all of the user's refresh tokens
export const logoutAll = async (req, res) => {
  try {
    await revokeAllRefreshTokens(req.user._id);
    clearAuthCookies(res);
    res.json({ message: "Logged out from all devices" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Check Auth
export const checkAuth = (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
      role: req.user.role,
    },
  });
};

// Update Profile
export const updateProfile = async (req, res) => {
  try {
    const parsedBody = updateProfileSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(400).json({
        message: "Validation error",
        errors: parsedBody.error.flatten().fieldErrors,
      });
    }

    const { firstName, lastName, email } = parsedBody.data;

    // Check if email is already taken by another user
    const existingUser = await User.findOne({
      email,
      _id: { $ne: req.user._id },
    });
    if (existingUser) {
      return res.status(400).json({ message: "Email is already in use" });
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { firstName, lastName, email },
      { new: true, runValidators: true }
    );

    res.json({
      message: "Profile updated successfully",
      user: {
        id: updatedUser._id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        role: updatedUser.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Change Password
export const changePassword = async (req, res) => {
  try {
    const parsedBody = changePasswordSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(400).json({
        message: "Validation error",
        errors: parsedBody.error.flatten().fieldErrors,
      });
    }

    const { currentPassword, newPassword } = parsedBody.data;

    // Get user with password
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await User.findByIdAndUpdate(req.user._id, {
      password: hashedPassword,
    });

    // Any session opened with the old password is no longer trusted
    await revokeAllRefreshTokens(req.user._id);

    const refreshToken = await issueRefreshToken(req.user, req);
    setAuthCookies(res, signAccessToken(req.user), refreshToken);

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all users (Admin only)
export const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 50; // 50 users per page
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

    // Build query with search filter
    let query = { role: "user" }; // Only get regular users, not admins

    // Add search filter
    if (search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
      ];
    }

    // Get total count of users matching search
    const totalUsers = await User.countDocuments(query);

    // Get paginated users (exclude password field)
    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalUsers / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      users,
      pagination: {
        currentPage: page,
        totalPages,
        totalUsers,
        usersPerPage: limit,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
