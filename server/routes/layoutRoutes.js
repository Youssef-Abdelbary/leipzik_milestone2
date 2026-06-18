import express from "express";

import {
  getActiveStaff,
  saveLayout,
  shareLayout,
  getSharedLayoutsForStaff,
  getLayoutByEvent,
} from "../controllers/layoutController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { requireRoles, requireSelfParam } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(authenticate);

router.get("/staff", requireRoles("organizer"), getActiveStaff);
router.post("/", requireRoles("organizer"), saveLayout);
router.patch("/:layoutId/share", requireRoles("organizer"), shareLayout);
router.get("/shared/:staffId", requireRoles("staff"), requireSelfParam("staffId"), getSharedLayoutsForStaff);
router.get("/event/:eventId", requireRoles("organizer"), getLayoutByEvent);

export default router;
