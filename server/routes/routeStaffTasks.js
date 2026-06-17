import express from "express";
import {
  testStaffTasksRoute,
  getStaffEvents,
  getStaffAssignedTasks,
  updateTaskProgress,
} from "../controllers/controllerStaffTasks.js";

const router = express.Router();

router.get("/test", testStaffTasksRoute);
router.get("/events/:staffId", getStaffEvents);
router.get("/tasks/:staffId", getStaffAssignedTasks);
router.patch("/tasks/:taskId/progress", updateTaskProgress);

export default router;