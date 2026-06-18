import User from "../models/modelUser.js";
import { normalizeUserRecord } from "../utils/normalizeUser.js";

export const getAllUsers = async (req, res) => {
  try {
    const search = req.query.search?.trim();

    const filter = { role: { $ne: "guest" } };

    if (search) {
      filter.$or = [
        { fullname: { $regex: search, $options: "i" } },
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User
      .find(filter)
      .select("fullname fullName email role status createdAt")
      .sort({ createdAt: -1 })
      .lean();

    res.json(users.map(normalizeUserRecord));
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users." });
  }
};

export const toggleUserStatus = async (req, res) => {
  try {
    const user = await User
      .findById(req.params.id, "status role")
      .lean();

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.role === "guest") {
      return res.status(400).json({ message: "Guest accounts cannot be deactivated." });
    }

    const newStatus = user.status === "active" ? "inactive" : "active";

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { status: newStatus },
      { new: true, select: "fullname fullName email role status createdAt" }
    ).lean();

    res.json(normalizeUserRecord(updated));
  } catch (err) {
    res.status(500).json({ message: "Failed to update user status." });
  }
};