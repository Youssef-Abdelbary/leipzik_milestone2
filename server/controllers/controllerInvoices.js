import Invoice from "../models/modelInvoice.js";
import { createNotification } from "../utils/notificationUtil.js";
import { uploadToCloudinary } from "../utils/uploadCloudinary.js";
import multer from "multer";
import path from "path";

// ─── Multer Setup ─────────────────────────────────────────────────────────
export const upload = multer({ storage: multer.memoryStorage() });

// GET /api/invoices/:id
// Detects whether :id belongs to a vendor or an organizer (based on existing
// invoices) and returns the appropriate set of invoices + a "role" flag so
// the frontend knows which view/actions to show.
export const getInvoices = async (req, res) => {
  try {
    const { id } = req.params;

    const isVendor = await Invoice.exists({ vendorId: id });
    if (isVendor) {
      const invoices = await Invoice.find({ vendorId: id }).sort({ createdAt: -1 });
      return res.json({ role: "vendor", data: invoices });
    }

    const isOrganizer = await Invoice.exists({ organizerId: id });
    if (isOrganizer) {
      const invoices = await Invoice.find({ organizerId: id }).sort({ createdAt: -1 });
      return res.json({ role: "organizer", data: invoices });
    }

    return res.json({ role: "none", data: [] });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch invoices." });
  }
};

// POST /api/invoices
// Vendor creates and submits a new invoice.
export const createInvoice = async (req, res) => {
  try {
    console.log("createInvoice req.body:", req.body);

    const { organizerId, vendorId, eventId, vendorRequestId, invoiceNumber, items, tax, currency } = req.body;

    if (!organizerId || !vendorId || !invoiceNumber || !Array.isArray(items) || items.length === 0) {
      console.log("createInvoice validation failed", { organizerId, vendorId, invoiceNumber, items });
      return res.status(400).json({ message: "Missing required invoice fields." });
    }

    const itemsWithTotals = items.map((item) => ({
      ...item,
      total: item.quantity * item.unitPrice,
    }));
    console.log("itemsWithTotals:", itemsWithTotals);

    const subtotal = itemsWithTotals.reduce((sum, item) => sum + item.total, 0);
    const taxAmount = tax || 0;
    const totalAmount = subtotal + taxAmount;
    console.log("subtotal/tax/total:", subtotal, taxAmount, totalAmount);

    const invoice = await Invoice.create({
      organizerId,
      vendorId,
      eventId: eventId || null,
      vendorRequestId: vendorRequestId || null,
      invoiceNumber,
      items: itemsWithTotals,
      subtotal,
      tax: taxAmount,
      totalAmount,
      currency: currency || "EGP",
      status: "pending_review",
    });

    console.log("invoice created:", invoice);

    res.status(201).json({ data: invoice });
  } catch (err) {
    console.log("createInvoice error:", err);
    res.status(500).json({ message: "Failed to create invoice." });
  }
};

// PATCH /api/invoices/:id/review
// Organizer reviews an invoice (approve/reject/mark paid) and the vendor
// gets notified of the outcome.
export const reviewInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["approved", "rejected", "paid"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status." });
    }

    const invoice = await Invoice.findByIdAndUpdate(id, { status }, { new: true });

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found." });
    }

    await createNotification({
      userId: invoice.vendorId,
      type: "invoice_review",
      title: "Invoice reviewed",
      message: `Your invoice ${invoice.invoiceNumber} was ${status}.`,
      relatedEntityType: "vendor_invoice",
      relatedEntityId: invoice._id,
    });

    res.json({ data: invoice });
  } catch (err) {
    res.status(500).json({ message: "Failed to review invoice." });
  }
};

// PATCH /api/invoices/:id/documents
// Vendor attaches a supporting document to an existing invoice.
// Expects multipart/form-data with a "file" field (handled by multer,
// in-memory). The buffer is uploaded to Cloudinary, then the returned
// secure_url is stored on the invoice.
export const addSupportingDocument = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    const fileName = req.file.originalname;
    const ext = path.extname(fileName); // e.g. ".pdf"
    const uniqueName = `invoice-${Date.now()}${ext}`;

    const url = await uploadToCloudinary(req.file.buffer, "invoices", {
      resource_type: "raw",
      public_id: uniqueName,
    });

    const invoice = await Invoice.findByIdAndUpdate(
      id,
      { $push: { supportingDocuments: { fileName, url, uploadedAt: new Date() } } },
      { new: true }
    );

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found." });
    }

    res.json({ data: invoice });
  } catch (err) {
    console.log("addSupportingDocument error:", err);
    res.status(500).json({ message: "Failed to attach document." });
  }
};