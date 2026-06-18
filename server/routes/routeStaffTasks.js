import express from "express";
import {
  testStaffTasksRoute,
  getStaffEvents,
  getStaffAssignedTasks,
  updateTaskProgress,
} from "../controllers/controllerStaffTasks.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { requireRoles, requireSelfParam } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(authenticate);
router.use(requireRoles("staff"));

router.get("/test", testStaffTasksRoute);
router.get("/events/:staffId", requireSelfParam("staffId"), getStaffEvents);
router.get("/tasks/:staffId", requireSelfParam("staffId"), getStaffAssignedTasks);
router.patch("/tasks/:taskId/progress", updateTaskProgress);

export default router;
