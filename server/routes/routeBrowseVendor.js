import express from "express";
import { getVendors } from "../controllers/controllerVendor.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

//router.use(authenticate);

router.get("/", getVendors);

export default router;