import express from "express";

import {
  testWorkflowRoute,
  getUpcomingEvents,
  getWorkflowSummary,
  getWorkflowTasks,
  createTaskReminderNotifications,
  getWorkflowNotifications,
  markNotificationAsRead,
} from "../controllers/controllerWorkFlow.js";

const router = express.Router();

router.get("/test", testWorkflowRoute);
router.get("/events/:organizerId", getUpcomingEvents);
router.get("/summary/:organizerId", getWorkflowSummary);
router.get("/tasks/:organizerId", getWorkflowTasks);
router.post("/reminders", createTaskReminderNotifications);
router.get("/notifications/:userId", getWorkflowNotifications);
router.patch("/notifications/:notificationId/read", markNotificationAsRead);
export default router;