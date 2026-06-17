import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { getEventReport } from '../controllers/controllerEventReport.js';

const router = express.Router({ mergeParams: true });

// Mounted at /api/events/:eventId → full path: GET /api/events/:eventId/report
router.get('/report', authenticate, getEventReport);

export default router;
