import express from "express";
import { createVendorRequest, getVendorRequests } from "../controllers/controllerVendorRequest.js";
import { getVendors } from "../controllers/controllerVendor.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

//router.use(authenticate);


router.get("/", getVendors);
router.post("/", createVendorRequest);
router.get("/requests", getVendorRequests);

export default router;