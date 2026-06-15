import express from "express";
import {
  getInvoices,
  createInvoice,
  reviewInvoice,
  addSupportingDocument,
  upload,
} from "../controllers/controllerInvoices.js";

const router = express.Router();

router.get("/:id", getInvoices);
router.post("/", createInvoice);
router.patch("/:id/review", reviewInvoice);
router.patch("/:id/documents", upload.single("file"), addSupportingDocument);

export default router;