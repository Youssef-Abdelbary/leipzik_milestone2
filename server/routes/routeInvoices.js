import express from "express";
import {
  getInvoices,
  createInvoice,
  reviewInvoice,
  addSupportingDocument,
  upload,
} from "../controllers/controllerInvoices.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { requireRoles, requireSelfParam } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(authenticate);

router.get("/:id", requireSelfParam("id"), getInvoices);
router.post("/", requireRoles("vendor"), createInvoice);
router.patch("/:id/review", requireRoles("organizer"), reviewInvoice);
router.patch("/:id/documents", requireRoles("vendor"), upload.single("file"), addSupportingDocument);

export default router;
