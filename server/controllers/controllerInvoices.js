import Invoice from "../models/modelInvoice.js";
import User from "../models/modelUser.js";
import VendorRequest from "../models/modelVendorRequest.js";
import Vendor from "../models/modelVendor.js";
import { ensureVendorProfile } from "../utils/ensureVendorProfile.js";
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
// Link via vendorRequestId (recommended) — eventId + organizerId are resolved automatically.
export const createInvoice = async (req, res) => {
  try {
    const { organizerEmail, eventId, vendorRequestId, invoiceNumber, items, tax, currency } = req.body;
    const vendorId = req.user?.user_id;

    if (!vendorId || !invoiceNumber || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "invoiceNumber and items are required." });
    }

    let resolvedEventId = eventId || null;
    let resolvedOrganizerId = null;

    if (vendorRequestId) {
      const request = await VendorRequest.findById(vendorRequestId).lean();
      if (!request) {
        return res.status(404).json({ message: "Vendor request not found." });
      }
      if (request.status !== "accepted") {
        return res.status(400).json({ message: "Invoices can only be linked to accepted orders." });
      }

      const vendorProfile = await ensureVendorProfile(vendorId);
      if (!vendorProfile || String(request.vendorId) !== String(vendorProfile._id)) {
        return res.status(403).json({ message: "This order does not belong to you." });
      }

      resolvedEventId = request.eventId;
      resolvedOrganizerId = request.organizerId;
    }

    if (!resolvedOrganizerId) {
      if (!organizerEmail) {
        return res.status(400).json({ message: "Provide organizerEmail or link the invoice to an accepted order." });
      }
      const organizer = await User.findOne({
        email: organizerEmail.toLowerCase().trim(),
        role: "organizer",
      });
      if (!organizer) {
        return res.status(404).json({ message: "No organizer found with that email." });
      }
      resolvedOrganizerId = organizer._id;
    }

    if (!resolvedEventId) {
      return res.status(400).json({ message: "Link the invoice to an accepted order so it appears under the correct event." });
    }

    const itemsWithTotals = items.map((item) => ({
      ...item,
      total: item.quantity * item.unitPrice,
    }));

    const subtotal = itemsWithTotals.reduce((sum, item) => sum + item.total, 0);
    const taxAmount = tax || 0;
    const totalAmount = subtotal + taxAmount;

    const invoice = await Invoice.create({
      organizerId: resolvedOrganizerId,
      vendorId,
      eventId: resolvedEventId,
      vendorRequestId: vendorRequestId || null,
      invoiceNumber,
      items: itemsWithTotals,
      subtotal,
      tax: taxAmount,
      totalAmount,
      currency: currency || "EGP",
      status: "pending_review",
    });

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

    const existing = await Invoice.findById(id);
    if (!existing) {
      return res.status(404).json({ message: "Invoice not found." });
    }

    if (String(existing.organizerId) !== String(req.user.user_id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const invoice = await Invoice.findByIdAndUpdate(id, { status }, { new: true });

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

    const invoice = await Invoice.findById(id);

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found." });
    }

    if (String(invoice.vendorId) !== String(req.user.user_id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const updated = await Invoice.findByIdAndUpdate(
      id,
      { $push: { supportingDocuments: { fileName, url, uploadedAt: new Date() } } },
      { new: true }
    );

    res.json({ data: updated });
  } catch (err) {
    console.log("addSupportingDocument error:", err);
    res.status(500).json({ message: "Failed to attach document." });
  }
};