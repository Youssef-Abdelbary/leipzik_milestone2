import bcrypt from "bcryptjs";
import modelUser from "../models/modelUser.js";
import Vendor from "../models/modelVendor.js";
import { generateToken, generateRefreshToken } from "../utils/generateJWT.js";
import { sendStaffWelcomeEmail, isEmailConfigured } from "../utils/emailUtil.js";

const ALLOWED_ROLES = ["vendor", "staff"];

export const register = async (req, res) => {
    try {
        const createdBy = req.user.user_id;
        const creatorRole = req.user.role;

        if (creatorRole !== "organizer") {
            return res.status(403).json({
                message: "Only event organizers can create users",
                errorType: "UNAUTHORIZED_ROLE",
            });
        }

        const { fullname, email, password, phone, role } = req.body;

        if (!fullname || !email || !password || !role) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (!ALLOWED_ROLES.includes(role)) {
            return res.status(400).json({ message: "Role must be one of: vendor, staff" });        }

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
            createdBy,
        });

        if (role === 'vendor') {
            await Vendor.create({
                userId: user._id,
                companyName: fullname,
                contactInfo: { contactPerson: fullname, email, phone: phone || '' },
                isActive: true,
            });
        }

        const token = generateToken(user._id, user.role);
        const refreshToken = generateRefreshToken(user._id);

 let emailSent = false;
        let emailWarning = null;
        if (role === "staff") {
            const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
            const loginUrl = `${clientUrl}/login`;
            if (isEmailConfigured()) {
                try {
                    await sendStaffWelcomeEmail({
                        to: email,
                        fullname,
                        email,
                        password,
                        loginUrl,
                    });
                    emailSent = true;
                } catch (emailErr) {
                    console.error("Failed to send staff welcome email:", emailErr.message);
                    emailWarning = "Account created, but the login email could not be sent. Share the credentials manually.";
                }
            } else {
                emailWarning = "Account created, but email is not configured. Share the login credentials manually.";
            }
        }
        const response = {
            message: role === "staff" && emailSent
                ? "Staff account created and login details emailed"
                : "User registered successfully",
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
                createdBy,
            },
        };
 if (role === "staff") {
            response.emailSent = emailSent;
            response.staffEmail = user.email;
            if (emailWarning) {
                response.emailWarning = emailWarning;
            }
        }
        return res.status(201).json(response);
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};