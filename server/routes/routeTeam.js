import express from "express";
import { 
    testTeamRoute,
    getStaffMembers,
    getEventTasks,
    assignTaskToStaff,
    createEventTask,
 } from "../controllers/controllerTeam.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { requireRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(authenticate);
router.use(requireRoles("organizer"));

router.get("/test", testTeamRoute);
router.get("/staff", getStaffMembers);
router.get("/events/:eventId/tasks", getEventTasks);
router.patch("/tasks/:taskId/assign", assignTaskToStaff);
router.post("/events/:eventId/tasks", createEventTask);

export default router;
