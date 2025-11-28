import express from 'express';
import {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
  getPatientMedicalHistory,
  addMedicalRecord
} from '../controllers/patientController.js';

const router = express.Router();

// Patient routes
router.get('/doctor/:doctorId', getPatients);
router.get('/:patientId', getPatientById);
router.post('/', createPatient);
router.put('/:patientId', updatePatient);

// Medical records routes
router.get('/:patientId/medical-history', getPatientMedicalHistory);
router.post('/:patientId/medical-records', addMedicalRecord);

export default router;
