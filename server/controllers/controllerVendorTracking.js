// src/controllers/controllerVendorTracking.js
import VendorRequest from '../models/modelVendorRequest.js';
import Event from '../models/modelEvent.js';

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