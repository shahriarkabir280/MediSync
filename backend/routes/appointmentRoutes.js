import express from 'express';
import { authenticate, doctorOnly, requireOwnDoctor, requireOwnPatient, ROLES } from '../middleware/auth.js';
import {
  getAppointments,
  getTodayAppointments,
  createAppointment,
  updateAppointment,
  cancelAppointment,
  getAppointmentById,
  getAppointmentsByPatient
} from '../controllers/appointmentController.js';

const router = express.Router();

// Appointment routes
router.get('/doctor/:doctorId', doctorOnly, requireOwnDoctor(), getAppointments);
router.get('/doctor/:doctorId/today', doctorOnly, requireOwnDoctor(), getTodayAppointments);
router.get('/patient/:patientId', authenticate(ROLES.DOCTOR, ROLES.PATIENT), requireOwnPatient(), getAppointmentsByPatient);
router.get('/:appointmentId', doctorOnly, getAppointmentById);
// Public: visitors book from a doctor's public website without an account
router.post('/doctor/:doctorId', createAppointment);
router.put('/:appointmentId', doctorOnly, updateAppointment);
router.patch('/:appointmentId/cancel', doctorOnly, cancelAppointment);

export default router;
