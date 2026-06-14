import { verifyToken, verifyRefreshToken, generateToken } from "../utils/generateJWT.js";
import User from "../models/modelUser.js";
import { log } from "../utils/logger.js";

export async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  //log("auth middleware called");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Authorization token required",
      errorType: "TOKEN_MISSING",
    });
  }

  const token = authHeader.split(" ")[1];
  const result = verifyToken(token);

  if (result.success) {
    req.user = result.decoded;
    return next();
  }

  if (result.errorType !== "TOKEN_EXPIRED") {
    return res.status(401).json({
      message: result.message,
      errorType: result.errorType,
    });
  }

  const refreshToken = req.headers["x-refresh-token"];

  if (!refreshToken) {
    return res.status(401).json({
      message: "Session expired, please log in again",
      errorType: "RELOGIN_REQUIRED",
    });
  }

  const refreshResult = verifyRefreshToken(refreshToken);

  if (!refreshResult.success) {
    return res.status(401).json({
      message: "Session expired, please log in again",
      errorType: "RELOGIN_REQUIRED",
    });
  }

  const user = await User.findById(refreshResult.decoded.user_id, "role").lean();

  if (!user) {
    return res.status(401).json({
      message: "User not found, please log in again",
      errorType: "RELOGIN_REQUIRED",
    });
  }

  const newToken = generateToken(user._id.toString(), user.role);

  res.setHeader("x-new-token", newToken);

  req.user = {
    user_id: user._id.toString(),
    role: user.role,
  };

  return next();
}