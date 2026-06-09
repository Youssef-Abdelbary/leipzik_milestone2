import express from "express";
import { register } from "../controllers/controllerRegisterOthers.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authenticate, register); // POST /api/users

export default router;