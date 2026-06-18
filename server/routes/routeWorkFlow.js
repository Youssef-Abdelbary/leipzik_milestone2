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
import { authenticate } from "../middleware/authMiddleware.js";
import { requireRoles, requireSelfParam } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(authenticate);
router.use(requireRoles("organizer"));

router.get("/test", testWorkflowRoute);
router.get("/events/:organizerId", requireSelfParam("organizerId"), getUpcomingEvents);
router.get("/summary/:organizerId", requireSelfParam("organizerId"), getWorkflowSummary);
router.get("/tasks/:organizerId", requireSelfParam("organizerId"), getWorkflowTasks);
router.post("/reminders", createTaskReminderNotifications);
router.get("/notifications/:userId", requireSelfParam("userId"), getWorkflowNotifications);
router.patch("/notifications/:notificationId/read", markNotificationAsRead);

export default router;
