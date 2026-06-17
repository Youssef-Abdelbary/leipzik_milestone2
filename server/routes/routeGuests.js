import express from "express";
import {
  getGuests,
  getGuestsForStaff,
  getGuestsForStaffEvent,
  updateGuestCheckIn,
} from "../controllers/controllerGuests.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { log } from "../utils/logger.js";

const router = express.Router();

//log("auth by middleware applied to guests routes");
//router.use(authenticate);

router.get("/", getGuests);
router.patch("/:id/checkin", updateGuestCheckIn);
router.get("/staff/:staffId", getGuestsForStaff);
router.get("/staff/:staffId/event/:eventId", getGuestsForStaffEvent);

export default router;