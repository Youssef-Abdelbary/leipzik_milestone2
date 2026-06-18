import express from "express";
import {
  getEventVendorsForStaff,
  markVendorArrived,
} from "../controllers/controllerStaffDayOf.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { requireRoles, requireSelfParam } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(authenticate);
router.use(requireRoles("staff"));

router.get(
  "/staff/:staffId/events/:eventId/vendors",
  requireSelfParam("staffId"),
  getEventVendorsForStaff
);

router.patch(
  "/staff/:staffId/events/:eventId/vendors/:vendorRequestId/arrival",
  requireSelfParam("staffId"),
  markVendorArrived
);

export default router;
