import Notification from "../models/modelNotification.js";

// GET /api/notifications/:userId
export const getNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });
    res.json({ data: notifications });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch notifications." });
  }
};

// PATCH /api/notifications/:id/read
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByIdAndUpdate(
      id,
      { status: "read" },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found." });
    }

    res.json({ data: notification });
  } catch (err) {
    res.status(500).json({ message: "Failed to update notification." });
  }
};