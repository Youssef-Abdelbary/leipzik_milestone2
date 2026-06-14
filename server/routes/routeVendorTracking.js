// src/routes/routeVendorTracking.js
import express from 'express';
import { getEventVendorRequests, updateVendorDeliveryStatus } from '../controllers/controllerVendorTracking.js';

const router = express.Router();

// 11.4: View vendors associated with event
router.post('/search', getEventVendorRequests);
// 4.4 & 11.5: Update delivery states / mark as arrived
router.put('/delivery', updateVendorDeliveryStatus);
export default router;