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
router.use(requireRoles("organizer"));

router.get("/:id", requireSelfParam("id"), getInvoices);
router.post("/", createInvoice);
router.patch("/:id/review", reviewInvoice);
router.patch("/:id/documents", upload.single("file"), addSupportingDocument);

export default router;
