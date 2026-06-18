import express from "express";
import { createVendorRequest, getVendorRequests } from "../controllers/controllerVendorRequest.js";
import { getVendors } from "../controllers/controllerVendor.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { requireRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/", getVendors);
router.post("/", authenticate, requireRoles("organizer"), createVendorRequest);
router.get("/requests", authenticate, requireRoles("organizer"), getVendorRequests);

export default router;
