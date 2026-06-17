import User from "../models/modelUser.js";

export const updateProfile = async (req, res) => {
  try {
    const { fullname, email, phone } = req.body;

    if (!fullname || !email || !phone) {
      return res.status(400).json({
        message: "Full name, email, and phone are required",
      });
    }

    const userId = req.user.user_id;

    if (!userId) {
      return res.status(401).json({
        message: "Invalid token: user id missing",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        fullname,
        email,
        phone,
      },
      {
        returnDocument: "after",
        runValidators: true,
      }
    ).select("-passwordHash");

    if (!updatedUser) {
      return res.status(404).json({
        message: "User does not exist",
      });
    }

    return res.status(200).json({
      message: "Profile updated successfully",
      user: {
        id: updatedUser._id,
        fullname: updatedUser.fullname,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        status: updatedUser.status,
        createdAt: updatedUser.createdAt,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Email is already in use",
      });
    }

    return res.status(500).json({
      message: error.message,
    });
  }
};