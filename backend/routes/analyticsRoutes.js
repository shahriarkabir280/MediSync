import express from 'express';
import { doctorOnly, requireOwnDoctor } from '../middleware/auth.js';
import {
  getAppointmentAnalytics,
  getPatientAnalytics,
  getRevenueAnalytics
} from '../controllers/analyticsController.js';

const router = express.Router();

// Analytics routes
router.get('/doctor/:doctorId/appointments', doctorOnly, requireOwnDoctor(), getAppointmentAnalytics);
router.get('/doctor/:doctorId/patients', doctorOnly, requireOwnDoctor(), getPatientAnalytics);
router.get('/doctor/:doctorId/revenue', doctorOnly, requireOwnDoctor(), getRevenueAnalytics);

export default router;
