import express from "express";
import { updateProfile } from "../controllers/controllerUserProfile.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.put("/", authenticate, updateProfile);

export default router;