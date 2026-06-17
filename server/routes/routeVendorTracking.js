// src/routes/routeVendorTracking.js
import express from 'express';
import { getEventVendorRequests, updateVendorDeliveryStatus, getMyVendorRequests, getMyVendorProfile, updateMyVendorProfile, getMyVendorInbox, respondToVendorRequest } from '../controllers/controllerVendorTracking.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// Vendor profile
router.get('/profile', authenticate, getMyVendorProfile);
router.patch('/profile', authenticate, updateMyVendorProfile);
// Vendor inbox: pending sourcing requests
router.get('/inbox', authenticate, getMyVendorInbox);
router.patch('/:requestId/respond', authenticate, respondToVendorRequest);
// 15.1: Vendor views own accepted orders
router.get('/mine', authenticate, getMyVendorRequests);
// 11.4: View vendors associated with event
router.post('/search', getEventVendorRequests);
// 4.4 & 11.5: Update delivery states / mark as arrived
router.put('/delivery', updateVendorDeliveryStatus);
export default router;