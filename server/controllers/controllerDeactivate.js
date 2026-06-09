import User from "../models/modelUser.js";

const MAX_USERS = 10;

export const getAllUsers = async (req, res) => {
  try {
    const search = req.query.search?.trim();

    const filter = search
      ? {
          $or: [
            { fullname: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const users = await User
      .find(filter, "fullname email role status createdAt")
      .lean()
      .limit(MAX_USERS);

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users." });
  }
};

export const toggleUserStatus = async (req, res) => {
  try {
    const user = await User
      .findById(req.params.id, "status")
      .lean();

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const newStatus = user.status === "active" ? "inactive" : "active";

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { status: newStatus },
      { new: true, select: "fullname email role status createdAt" }
    ).lean();

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Failed to update user status." });
  }
};