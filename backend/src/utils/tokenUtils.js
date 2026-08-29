import crypto from "crypto";
import jwt from "jsonwebtoken";

import RefreshToken from "../models/refreshTokenModel.js";

export const ACCESS_TOKEN_COOKIE = "accessToken";
export const REFRESH_TOKEN_COOKIE = "refreshToken";

// Refresh cookie is scoped to the auth routes so it is never sent with
// ordinary API calls.
export const REFRESH_COOKIE_PATH = "/api/auth";

// Read lazily: ESM evaluates module bodies before server.js can call
// dotenv.config(), so process.env is not populated at import time.
let config = null;

const getConfig = () => {
  if (config) return config;

  const accessSecret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
  const refreshSecret =
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;

  if (!accessSecret || !refreshSecret) {
    throw new Error(
      "Missing JWT secrets: set JWT_ACCESS_SECRET and JWT_REFRESH_SECRET"
    );
  }

  if (accessSecret === refreshSecret) {
    console.warn(
      "⚠️  JWT access and refresh secrets are identical. Set two different secrets so an access token can never be replayed as a refresh token."
    );
  }

  config = {
    accessSecret,
    refreshSecret,
    accessTtl: process.env.ACCESS_TOKEN_TTL || "15m",
    refreshTtl: process.env.REFRESH_TOKEN_TTL || "7d",
  };

  return config;
};

const ttlToMs = (ttl) => {
  const match = String(ttl).match(/^(\d+)([smhd])$/);
  if (!match) return Number(ttl) * 1000;

  const value = Number(match[1]);
  const unit = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[match[2]];
  return value * unit;
};

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const cookieBaseOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
});

export const signAccessToken = (user) => {
  const { accessSecret, accessTtl } = getConfig();
  return jwt.sign({ id: user._id, role: user.role }, accessSecret, {
    expiresIn: accessTtl,
  });
};

export const verifyAccessToken = (token) =>
  jwt.verify(token, getConfig().accessSecret);

export const verifyRefreshToken = (token) =>
  jwt.verify(token, getConfig().refreshSecret);

// Signs a refresh token and stores its hash so it can be rotated and revoked.
export const issueRefreshToken = async (user, req) => {
  const { refreshSecret, refreshTtl } = getConfig();

  const token = jwt.sign(
    { id: user._id, jti: crypto.randomUUID() },
    refreshSecret,
    { expiresIn: refreshTtl }
  );

  await RefreshToken.create({
    user: user._id,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + ttlToMs(refreshTtl)),
    userAgent: req?.headers?.["user-agent"] ?? "",
    ip: req?.ip ?? "",
  });

  return token;
};

export const findStoredRefreshToken = (token) =>
  RefreshToken.findOne({ tokenHash: hashToken(token) });

export const revokeRefreshToken = (token) =>
  RefreshToken.updateOne(
    { tokenHash: hashToken(token), revokedAt: null },
    { revokedAt: new Date() }
  );

// Used on reuse detection: kill every session the user has.
export const revokeAllRefreshTokens = (userId) =>
  RefreshToken.updateMany(
    { user: userId, revokedAt: null },
    { revokedAt: new Date() }
  );

export const setAuthCookies = (res, accessToken, refreshToken) => {
  const { accessTtl, refreshTtl } = getConfig();

  res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
    ...cookieBaseOptions(),
    maxAge: ttlToMs(accessTtl),
  });

  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
    ...cookieBaseOptions(),
    path: REFRESH_COOKIE_PATH,
    maxAge: ttlToMs(refreshTtl),
  });
};

export const clearAuthCookies = (res) => {
  res.clearCookie(ACCESS_TOKEN_COOKIE, cookieBaseOptions());
  res.clearCookie(REFRESH_TOKEN_COOKIE, {
    ...cookieBaseOptions(),
    path: REFRESH_COOKIE_PATH,
  });
  // Clear the pre-refresh-token cookie so old sessions do not linger.
  res.clearCookie("token", cookieBaseOptions());
};
