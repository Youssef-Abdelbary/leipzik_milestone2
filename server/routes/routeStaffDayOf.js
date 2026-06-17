import express from "express";
import {
  getEventVendorsForStaff,
  markVendorArrived,
} from "../controllers/controllerStaffDayOf.js";

const router = express.Router();

router.get("/staff/:staffId/events/:eventId/vendors", getEventVendorsForStaff);

router.patch(
  "/staff/:staffId/events/:eventId/vendors/:vendorRequestId/arrival",
  markVendorArrived
);

export default router;