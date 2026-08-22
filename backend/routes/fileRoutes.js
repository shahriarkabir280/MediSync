import express from 'express';
import { upload, uploadPatientFile, getPatientFiles, downloadFile, deleteFile } from '../controllers/fileController.js';

const router = express.Router();

// Upload file for patient
router.post('/patients/:patientId/files', upload.single('file'), uploadPatientFile);

// Get all files for a patient  
router.get('/patients/:patientId/files', getPatientFiles);

// Download/View file
router.get('/files/:filename', downloadFile);

// Delete file
router.delete('/files/:fileId', deleteFile);

export default router;