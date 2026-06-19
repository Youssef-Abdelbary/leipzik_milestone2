import bcrypt from "bcryptjs";
import User from "../models/modelUser.js";
import { ensureVenueListing } from "../utils/ensureVenueListing.js";
import { generateToken, generateRefreshToken } from "../utils/generateJWT.js";


// Login route
export const login = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email: email });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const passwordHash = await bcrypt.compare(password, user.passwordHash);

    if (!passwordHash) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }
    if (user.status !== "active") {
      return res.status(403).json({
        message: "Your account is inactive. Please contact the organizer.",
      });
    }

    if (user.role === "venue_owner") {
      await ensureVenueListing(user._id, { role: user.role });
    }

    const token = generateToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    res.json({
      message: "Login successful",
      token: token,
      refreshToken: refreshToken,
      user: {
        id: user._id,
        fullname: user.fullname,
        phone: user.phone,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
      },
    });

  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      message: "Server error during login",
    });
  }
};
