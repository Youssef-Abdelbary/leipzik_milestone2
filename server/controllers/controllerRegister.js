import bcrypt from "bcryptjs";
import modelUser from "../models/modelUser.js";
import { generateToken, generateRefreshToken } from "../utils/generateJWT.js";

const ALLOWED_ROLES = ["vendor", "venue_owner", "organizer"];

export const register = async (req, res) => {
    try {
        const { fullname, email, password, phone, role } = req.body;

        if (!fullname || !email || !password || !phone || !role) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (!ALLOWED_ROLES.includes(role)) {
            return res.status(400).json({ message: "Role must be one of: vendor, venue_owner, organizer" });
        }

        const existingUser = await modelUser.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: "Email already exists" });
        }

        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const user = await modelUser.create({
            fullname,
            email,
            passwordHash,
            phone,
            role,
        });

        const token = generateToken(user._id, user.role);
        const refreshToken = generateRefreshToken(user._id);

        return res.status(201).json({
            message: "User registered successfully",
            token,
            refreshToken,
            user: {
                id: user._id,
                fullname: user.fullname,
                email: user.email,
                phone: user.phone,
                role: user.role,
                status: user.status,
                createdAt: user.createdAt,
            },
        });

    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};