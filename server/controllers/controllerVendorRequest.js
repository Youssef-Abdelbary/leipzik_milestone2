import VendorRequest from "../models/modelVendorRequest.js";
import Vendor from "../models/modelVendor.js";
import Event from "../models/modelEvent.js";
import { findOrganizerEvent } from "../utils/eventAccess.js";

export const createVendorRequest = async (req, res) => {
  try {
    const { eventId, organizerId, vendorId, requestedItems, deliveryDate, deliveryLocation, organizerContactSnapshot } = req.body;

    if (!eventId || !vendorId) {
      return res.status(400).json({ message: "eventId and vendorId are required." });
    }

    if (organizerId && String(organizerId) !== String(req.user.user_id)) {
      return res.status(403).json({ message: "organizerId must match the authenticated user." });
    }

    const event = await findOrganizerEvent(req.user.user_id, eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found or access denied." });
    }

    const vendor = await Vendor.findById(vendorId);

    if (!vendor)          return res.status(404).json({ message: "Vendor not found." });
    if (!vendor.isActive) return res.status(400).json({ message: "Vendor is not active." });

    const request = await VendorRequest.create({
      eventId,
      organizerId: req.user.user_id,
      vendorId,
      requestedItems,
      deliveryDate,
      deliveryLocation,
      organizerContactSnapshot,
    });
    res.status(201).json({ data: request });
  } catch (err) {
    console.error("createVendorRequest error:", err);
    res.status(500).json({ message: "Failed to create sourcing request.", error: err.message });
  }
};

export const getVendorRequests = async (req, res) => {
  try {
    const organizerId = req.user?.user_id;
    if (!organizerId) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const requests = await VendorRequest.find({ organizerId })
      .populate("vendorId", "companyName mainLocation")
      .sort({ createdAt: -1 });

    res.json({ data: requests });
  } catch (err) {
    console.error("getVendorRequests error:", err);
    res.status(500).json({ message: "Failed to fetch sourcing requests.", error: err.message });
  }
};