const { generateToken, generateRefreshToken, verifyToken, refreshAccessToken } = require("./utils/generateJWT");

// On login — generate both tokens
const accessToken = generateToken("u1", "admin");
const refreshToken = generateRefreshToken("u1");

console.log("Access Token:", accessToken);
console.log("Refresh Token:", refreshToken);

// Normal request — verify access token
const decoded = verifyToken(accessToken);
console.log("Decoded:", decoded);

// Access token expired — use refresh token to get a new one
const newAccessToken = refreshAccessToken(refreshToken);
console.log("New Access Token:", newAccessToken);