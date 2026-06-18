import express from "express";
import { getAllUsers, toggleUserStatus } from "../controllers/controllerDeactivate.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { requireRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(authenticate);
router.use(requireRoles("organizer"));

router.get("/", getAllUsers);
router.put("/:id", toggleUserStatus);

export default router;
