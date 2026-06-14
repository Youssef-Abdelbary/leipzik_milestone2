import VendorRequest from "../models/modelVendorRequest.js";
import Vendor from "../models/modelVendor.js";
import Event from "../models/modelEvent.js";

export const createVendorRequest = async (req, res) => {
  try {
    const { eventId, organizerId, vendorId, requestedItems, deliveryDate, deliveryLocation, organizerContactSnapshot } = req.body;

    if (!eventId || !organizerId || !vendorId)
      return res.status(400).json({ message: "eventId, organizerId, and vendorId are required." });

    const [vendor, event] = await Promise.all([Vendor.findById(vendorId), Event.findById(eventId)]);

    if (!vendor)          return res.status(404).json({ message: "Vendor not found." });
    if (!vendor.isActive) return res.status(400).json({ message: "Vendor is not active." });
    if (!event)           return res.status(404).json({ message: "Event not found." });

    const request = await VendorRequest.create({ eventId, organizerId, vendorId, requestedItems, deliveryDate, deliveryLocation, organizerContactSnapshot });
    res.status(201).json({ data: request });
  } catch (err) {
    console.error("createVendorRequest error:", err);
    res.status(500).json({ message: "Failed to create sourcing request.", error: err.message });
  }
};

export const getVendorRequests = async (req, res) => {
  try {
    const organizerId = req.user?._id || req.query.organizerId;
    const requests = await VendorRequest.find({ organizerId })
      .populate("vendorId", "companyName mainLocation")
      .sort({ createdAt: -1 });

    res.json({ data: requests });
  } catch (err) {
    console.error("getVendorRequests error:", err);
    res.status(500).json({ message: "Failed to fetch sourcing requests.", error: err.message });
  }
};