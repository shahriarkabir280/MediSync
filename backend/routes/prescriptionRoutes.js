import express from 'express';
import * as prescriptionController from '../controllers/prescriptionController.js';
const router = express.Router();

// Create a new prescription
router.post('/', prescriptionController.createPrescription);

// Get all prescriptions for a specific patient
router.get('/patient/:patientId', prescriptionController.getPatientPrescriptions);

// Get a single prescription by ID
router.get('/:prescriptionId', prescriptionController.getPrescriptionById);

export default router;
