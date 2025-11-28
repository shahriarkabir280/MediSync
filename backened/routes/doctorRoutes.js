import express from 'express';
import {
  getDoctorProfile,
  updateDoctorProfile,
  getDashboardStats,
  updateDoctorSettings,
  getDoctorSettings
} from '../controllers/doctorController.js';

const router = express.Router();

// Profile routes
router.get('/:doctorId/profile', getDoctorProfile);
router.put('/:doctorId/profile', updateDoctorProfile);

// Dashboard stats
router.get('/:doctorId/stats', getDashboardStats);

// Settings routes
router.get('/:doctorId/settings', getDoctorSettings);
router.put('/:doctorId/settings', updateDoctorSettings);

export default router;
