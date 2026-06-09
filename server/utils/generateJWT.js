import "dotenv/config";
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

export function generateToken(user_id, role) {
  return jwt.sign({ user_id, role }, SECRET, { expiresIn: "1m" });
}

export function generateRefreshToken(user_id) {
  return jwt.sign({ user_id }, REFRESH_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, SECRET);
    return { success: true, decoded };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return { success: false, errorType: "TOKEN_EXPIRED", message: "Token has expired" };
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return { success: false, errorType: "TOKEN_INVALID", message: "Token is invalid" };
    }

    if (error instanceof jwt.NotBeforeError) {
      return { success: false, errorType: "TOKEN_NOT_ACTIVE", message: "Token is not yet active" };
    }

    return { success: false, errorType: "TOKEN_ERROR", message: "Token verification failed" };
  }
}

export function verifyRefreshToken(refreshToken) {
  try {
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
    return { success: true, decoded };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return { success: false, errorType: "TOKEN_EXPIRED", message: "Refresh token has expired" };
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return { success: false, errorType: "TOKEN_INVALID", message: "Refresh token is invalid" };
    }

    return { success: false, errorType: "TOKEN_ERROR", message: "Refresh token verification failed" };
  }
}