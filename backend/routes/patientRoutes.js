import express from 'express';
import { authenticate, doctorOnly, requireOwnDoctor, requireOwnPatient, ROLES } from '../middleware/auth.js';
import {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
  getPatientMedicalHistory,
  addMedicalRecord,
  deleteMedicalRecord
} from '../controllers/patientController.js';

const router = express.Router();
const doctorOrSelf = [authenticate(ROLES.DOCTOR, ROLES.PATIENT), requireOwnPatient()];

// Patient routes
router.get('/doctor/:doctorId', doctorOnly, requireOwnDoctor(), getPatients);
router.get('/:patientId', doctorOrSelf, getPatientById);
// Public: patient self-signup (doctors also add patients through this endpoint)
router.post('/', createPatient);
router.put('/:patientId', doctorOrSelf, updatePatient);
router.delete('/:patientId', doctorOnly, deletePatient);

// Medical records routes
router.get('/:patientId/medical-history', doctorOrSelf, getPatientMedicalHistory);
router.post('/:patientId/medical-records', doctorOnly, addMedicalRecord);
router.delete('/:patientId/medical-records/:recordId', doctorOnly, deleteMedicalRecord);

export default router;
