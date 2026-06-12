import express from "express";
import { getGuests, updateGuestCheckIn } from "../controllers/controllerGuests.js";
import { authenticate } from "../middleware/authMiddleware.js";
import {log } from "../utils/logger.js";

const router = express.Router();

//log("auth by middleware applied to guests routes");
router.use(authenticate);

router.get("/", getGuests);
router.patch("/:id/checkin", updateGuestCheckIn);

export default router;