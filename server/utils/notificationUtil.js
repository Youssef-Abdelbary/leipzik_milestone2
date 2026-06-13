import Notification from "../models/modelNotification.js";

/**
 * Creates a notification. Call this from any controller/service
 * whenever something happens that the user should be notified about.
 *
 * Example usage (inside another controller):
 *   import { createNotification } from "../utils/notificationUtil.js";
 *
 *   await createNotification({
 *     userId: task.assignedTo,
 *     type: "task_reminder",
 *     title: "Task due soon",
 *     message: "Confirm vendor delivery time before tomorrow.",
 *     relatedEntityType: "event_task",
 *     relatedEntityId: task._id,
 *     scheduledFor: someDate, // optional
 *   });
 */
export const createNotification = async ({
  userId,
  type,
  title,
  message,
  relatedEntityType = null,
  relatedEntityId = null,
  scheduledFor = null,
}) => {
  try {
    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      relatedEntityType,
      relatedEntityId,
      scheduledFor,
    });
    return notification;
  } catch (err) {
    console.error("Failed to create notification:", err.message);
    return null;
  }
};