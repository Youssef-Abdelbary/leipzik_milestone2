import express from "express";
import { 
    testTeamRoute,
    getStaffMembers,
    getEventTasks,
    assignTaskToStaff,
    createEventTask,
 } from "../controllers/controllerTeam.js";

const router = express.Router();

router.get("/test", testTeamRoute);
router.get("/staff", getStaffMembers);
router.get("/events/:eventId/tasks", getEventTasks);
router.patch("/tasks/:taskId/assign", assignTaskToStaff);
router.post("/events/:eventId/tasks", createEventTask);
export default router;