import express from 'express';
import {
  getAppointmentAnalytics,
  getPatientAnalytics,
  getRevenueAnalytics
} from '../controllers/analyticsController.js';

const router = express.Router();

// Analytics routes
router.get('/doctor/:doctorId/appointments', getAppointmentAnalytics);
router.get('/doctor/:doctorId/patients', getPatientAnalytics);
router.get('/doctor/:doctorId/revenue', getRevenueAnalytics);

export default router;
