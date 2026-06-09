import "dotenv/config";
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

export function generateToken(user_id, role) {
    const payload = { user_id, role };
    return jwt.sign(payload, SECRET, { expiresIn: "2h" });
}

export function generateRefreshToken(user_id) {
    return jwt.sign({ user_id }, REFRESH_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token) {
    const decoded = jwt.verify(token, SECRET);
    return decoded;
}

export function refreshAccessToken(refreshToken) {
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
    return generateToken(decoded.user_id, decoded.role);
}