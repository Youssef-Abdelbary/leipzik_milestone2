import express from "express";
import { register } from "../controllers/controllerRegisterOthers.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { requireRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/", authenticate, requireRoles("organizer"), register);

export default router;