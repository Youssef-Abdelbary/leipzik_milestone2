// src/controllers/controllerVendorTracking.js
import VendorRequest from '../models/modelVendorRequest.js';
import Vendor from '../models/modelVendor.js';
import Event from '../models/modelEvent.js';
import { ensureVendorProfile } from '../utils/ensureVendorProfile.js';

// 11.4: View vendors associated with an event via req.body payload
export const getEventVendorRequests = async (req, res) => {
    try {
        const { eventId } = req.body;

        if (!eventId) {
            return res.status(400).json({ message: 'eventId parameter is required in the request body.' });
        }

        const [eventCheck, requests] = await Promise.all([
            Event.findById(eventId),
            VendorRequest.find({ eventId })
                .populate('vendorId', 'companyName mainLocation suppliesOffered')
                .sort({ 'deliveryDate': 1 })
        ]);

        if (!eventCheck) {
            return res.status(404).json({ message: 'Event target record not found.' });
        }

        res.json({ data: requests });
    } catch (err) {
        console.error('getEventVendorRequests error:', err);
        res.status(500).json({ message: 'Failed to fetch event vendor tracking records.', error: err.message });
    }
};

// Vendor: get own profile
export const getMyVendorProfile = async (req, res) => {
    try {
        const userId = req.user?.user_id;
        if (!userId) return res.status(401).json({ message: 'Authentication required.' });
        const profile = await ensureVendorProfile(userId);
        if (!profile) return res.status(404).json({ message: 'Vendor profile not found.' });
        res.json({ data: profile.toObject ? profile.toObject() : profile });
    } catch (err) {
        console.error('getMyVendorProfile error:', err);
        res.status(500).json({ message: 'Failed to fetch vendor profile.', error: err.message });
    }
};

// Vendor: update own profile
export const updateMyVendorProfile = async (req, res) => {
    try {
        const userId = req.user?.user_id;
        if (!userId) return res.status(401).json({ message: 'Authentication required.' });

        const existing = await ensureVendorProfile(userId);
        if (!existing) return res.status(404).json({ message: 'Vendor profile not found.' });

        const { companyName, suppliesOffered, mainLocation, pricingList, contactInfo } = req.body;

        const updated = await Vendor.findOneAndUpdate(
            { userId },
            { $set: { companyName, suppliesOffered, mainLocation, pricingList, contactInfo, updatedAt: new Date() } },
            { new: true, runValidators: true }
        ).lean();

        res.json({ data: updated });
    } catch (err) {
        console.error('updateMyVendorProfile error:', err);
        res.status(500).json({ message: 'Failed to update vendor profile.', error: err.message });
    }
};

// Vendor: view incoming pending sourcing requests
export const getMyVendorInbox = async (req, res) => {
    try {
        const userId = req.user?.user_id;
        if (!userId) return res.status(401).json({ message: 'Authentication required.' });

        const vendorProfile = await ensureVendorProfile(userId);
        if (!vendorProfile) return res.json({ data: [] });

        const requests = await VendorRequest.find({
            vendorId: vendorProfile._id,
            status: 'pending',
        })
            .populate('eventId', 'title date locationSnapshot status')
            .sort({ createdAt: -1 });

        res.json({ data: requests });
    } catch (err) {
        console.error('getMyVendorInbox error:', err);
        res.status(500).json({ message: 'Failed to fetch incoming requests.', error: err.message });
    }
};

// Vendor: accept or reject a sourcing request
export const respondToVendorRequest = async (req, res) => {
    try {
        const userId = req.user?.user_id;
        if (!userId) return res.status(401).json({ message: 'Authentication required.' });

        const { requestId } = req.params;
        const { status, message } = req.body;

        if (!['accepted', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Status must be accepted or rejected.' });
        }

        const vendorProfile = await ensureVendorProfile(userId);
        if (!vendorProfile) return res.status(404).json({ message: 'Vendor profile not found.' });

        const requestRecord = await VendorRequest.findOne({
            _id: requestId,
            vendorId: vendorProfile._id,
            status: 'pending',
        });
        if (!requestRecord) {
            return res.status(404).json({ message: 'Pending request not found.' });
        }

        requestRecord.status = status;
        requestRecord.vendorResponse = {
            message: message?.trim() || null,
            respondedAt: new Date(),
        };
        if (status === 'accepted') {
            requestRecord.delivery = { status: null, estimatedArrivalTime: null };
        }

        await requestRecord.save();
        const populated = await VendorRequest.findById(requestRecord._id)
            .populate('eventId', 'title date locationSnapshot status');

        res.json({ data: populated });
    } catch (err) {
        console.error('respondToVendorRequest error:', err);
        res.status(500).json({ message: 'Failed to respond to request.', error: err.message });
    }
};

// 15.1: Vendor views their own accepted orders across all events
export const getMyVendorRequests = async (req, res) => {
    try {
        const userId = req.user?.user_id;
        if (!userId) {
            return res.status(401).json({ message: 'Authentication required.' });
        }

        const vendorProfile = await ensureVendorProfile(userId);
        if (!vendorProfile) {
            return res.json({ data: [] });
        }

        const requests = await VendorRequest.find({
            vendorId: vendorProfile._id,
            status: 'accepted',
        })
            .populate('eventId', 'title date locationSnapshot status')
            .sort({ deliveryDate: 1 });

        res.json({ data: requests });
    } catch (err) {
        console.error('getMyVendorRequests error:', err);
        res.status(500).json({ message: 'Failed to fetch vendor orders.', error: err.message });
    }
};

// 4.4 & 11.5: Update delivery status safely via req.body parameters
export const updateVendorDeliveryStatus = async (req, res) => {
    try {
        const { requestId, status, estimatedArrivalTime } = req.body;

        if (!requestId || !status) {
            return res.status(400).json({ message: 'requestId and status parameters are required inside body payload.' });
        }

        const requestRecord = await VendorRequest.findById(requestId);
        if (!requestRecord) {
            return res.status(404).json({ message: 'Vendor request instance not found.' });
        }

        requestRecord.delivery.status = status;
        if (estimatedArrivalTime !== undefined) {
            requestRecord.delivery.estimatedArrivalTime = estimatedArrivalTime;
        }

        await requestRecord.save();
        res.json({ message: 'Delivery metrics updated successfully.', data: requestRecord });
    } catch (err) {
        console.error('updateVendorDeliveryStatus error:', err);
        res.status(500).json({ message: 'Failed to update delivery operational metrics.', error: err.message });
    }
};