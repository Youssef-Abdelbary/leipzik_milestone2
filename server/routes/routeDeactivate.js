import express from "express";
import { getAllUsers, toggleUserStatus } from "../controllers/controllerDeactivate.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authenticate);

router.get("/", getAllUsers);
router.put("/:id", toggleUserStatus);

export default router;