import express from "express";
import { getNotifications, markAsRead } from "../controllers/controllerNotification.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { requireSelfParam } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(authenticate);

router.get("/:userId", requireSelfParam("userId"), getNotifications);
router.patch("/:id/read", markAsRead);

export default router;
