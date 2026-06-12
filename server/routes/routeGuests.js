import express from "express";
import { getGuests, updateGuestCheckIn } from "../controllers/controllerGuests.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authenticate);

router.get("/", getGuests);
router.patch("/:id/checkin", updateGuestCheckIn);

export default router;