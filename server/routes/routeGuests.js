import express from "express";
import {
  getGuests,
  getGuestsForStaff,
  getGuestsForStaffEvent,
  updateGuestCheckIn,
} from "../controllers/controllerGuests.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { requireRoles, requireSelfParam } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(authenticate);

router.get("/", requireRoles("organizer"), getGuests);
router.patch("/:id/checkin", requireRoles("staff", "organizer"), updateGuestCheckIn);
router.get("/staff/:staffId", requireSelfParam("staffId"), getGuestsForStaff);
router.get("/staff/:staffId/event/:eventId", requireSelfParam("staffId"), getGuestsForStaffEvent);

export default router;
