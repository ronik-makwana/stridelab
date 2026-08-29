import User from "../models/userModel.js";
import { ACCESS_TOKEN_COOKIE, verifyAccessToken } from "../utils/tokenUtils.js";

export const protect = async (req, res, next) => {
  try {
    const token = req.cookies[ACCESS_TOKEN_COOKIE];
    if (!token) return res.status(401).json({ message: "Not authorized" });

    const decoded = verifyAccessToken(token);

    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(401).json({ message: "Not authorized" });

    req.user = user;
    next();
  } catch (err) {
    // The client uses this code to decide when to hit /auth/refresh
    res.status(401).json({ message: "Token invalid or expired" });
  }
};

export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Admin access required" });
  }
};

export default protect;
