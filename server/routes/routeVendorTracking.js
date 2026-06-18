// src/routes/routeVendorTracking.js
import express from 'express';
import {
    getEventVendorRequests,
    updateVendorDeliveryStatus,
    getMyVendorRequests,
    getMyVendorProfile,
    updateMyVendorProfile,
    getMyVendorInbox,
    respondToVendorRequest,
    sendVendorClarificationMessage,
} from '../controllers/controllerVendorTracking.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// Vendor profile
router.get('/profile',              authenticate, getMyVendorProfile);
router.patch('/profile',            authenticate, updateMyVendorProfile);

// Vendor inbox: pending sourcing requests
router.get('/inbox',                authenticate, getMyVendorInbox);

// Static-path param routes — must come before /:requestId wildcards
router.get('/mine',                 authenticate, getMyVendorRequests);
router.post('/search',              getEventVendorRequests);
router.put('/delivery',             updateVendorDeliveryStatus);

// Parameterised routes
router.patch('/:requestId/respond', authenticate, respondToVendorRequest);
router.post('/:requestId/message',  authenticate, sendVendorClarificationMessage);

export default router;