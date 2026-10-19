import express from 'express';
import { authenticate, doctorOnly, ROLES } from '../middleware/auth.js';
import { upload, uploadPatientFile, getPatientFiles, downloadFile, deleteFile } from '../controllers/fileController.js';

const router = express.Router();

// Upload file for patient
router.post('/patients/:patientId/files', doctorOnly, upload.single('file'), uploadPatientFile);

// Get all files for a patient  
router.get('/patients/:patientId/files', doctorOnly, getPatientFiles);

// Download/View file
// Opened via <img>/<iframe>/window.open, so the token may arrive as ?token=
router.get('/files/:filename', authenticate(ROLES.DOCTOR, ROLES.PATIENT), downloadFile);

// Delete file
router.delete('/files/:fileId', doctorOnly, deleteFile);

export default router;