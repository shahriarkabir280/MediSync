import express from 'express';
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
router.get('/doctor/:doctorId', getAppointments);
router.get('/doctor/:doctorId/today', getTodayAppointments);
router.get('/patient/:patientId', getAppointmentsByPatient);
router.get('/:appointmentId', getAppointmentById);
router.post('/doctor/:doctorId', createAppointment);
router.put('/:appointmentId', updateAppointment);
router.patch('/:appointmentId/cancel', cancelAppointment);

export default router;
