require("dotenv").config();
const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

// Creates a short lived access token (2 hours)
function generateToken(user_id, role) {
    const payload = { user_id, role };
    return jwt.sign(payload, SECRET, { expiresIn: "2h" });
}

// Creates a long lived refresh token (7 days)
function generateRefreshToken(user_id) {
    return jwt.sign({ user_id }, REFRESH_SECRET, { expiresIn: "7d" });
}

// Verifies the access token and returns the data
function verifyToken(token) {
    const decoded = jwt.verify(token, SECRET);
    return decoded;
}

// Verifies the refresh token and returns a brand new access token
function refreshAccessToken(refreshToken) {
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
    return generateToken(decoded.user_id, decoded.role);
}

module.exports = { generateToken, generateRefreshToken, verifyToken, refreshAccessToken };