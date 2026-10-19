import express from 'express';
import { authenticate, doctorOnly, requireOwnDoctor, ROLES } from '../middleware/auth.js';
import {
  getLabStats,
  getRecentLabOrders,
  searchLabOrders,
  getFilteredLabOrders,
  getLabReport,
  getLabCategories,
  getLabTests,
  createLabOrder,
  getLabOrders,
  getAllLabOrders,
  getLabOrderDetails,
  updateLabOrderStatus,
  updateLabResult,
  getPatientLabHistory,
  deleteLabOrder,
  getLabPatients,
  uploadLabReportFile,
  uploadLabOrderItemReport,
  updateLabReportFile,
  getPendingReviews,
  verifyLabResultsForOrder,
  updateLabOrder
} from '../controllers/labController.js';
import { labAiChat } from '../controllers/aiController.js';
import { upload } from '../controllers/fileController.js';

const router = express.Router();
const doctorOrDiagnostic = authenticate(ROLES.DOCTOR, ROLES.DIAGNOSTIC);

// Lab dashboard and statistics
router.get('/stats', doctorOnly, getLabStats);
router.get('/recent', doctorOnly, getRecentLabOrders);
router.get('/reviews/pending', doctorOnly, getPendingReviews);

// Lab search and filtering
router.get('/search', doctorOnly, searchLabOrders);
router.get('/filter', doctorOnly, getFilteredLabOrders);

router.get('/report/:orderId', doctorOnly, getLabReport);
router.put('/report/:orderId/file', doctorOnly, upload.single('file'), updateLabReportFile);

// Lab test categories and tests
router.get('/categories', doctorOnly, getLabCategories);
router.get('/tests', doctorOnly, getLabTests);

// Lab orders
router.post('/orders', doctorOnly, createLabOrder);
router.get('/orders/all', doctorOrDiagnostic, getAllLabOrders); // Must be before /orders/:orderId to avoid matching params
router.get('/orders/doctor/:doctorId', doctorOnly, requireOwnDoctor(), getLabOrders);
router.get('/orders/:orderId', doctorOrDiagnostic, getLabOrderDetails);
router.put('/orders/:orderId', doctorOnly, updateLabOrder);
router.put('/orders/:orderId/status', doctorOrDiagnostic, updateLabOrderStatus);
router.post('/orders/:orderId/report', doctorOnly, upload.single('file'), uploadLabReportFile);
router.post('/orders/item/:orderItemId/report', doctorOrDiagnostic, upload.single('file'), uploadLabOrderItemReport);
router.put('/orders/:orderId/verify', doctorOnly, verifyLabResultsForOrder);
router.delete('/orders/:orderId', doctorOnly, deleteLabOrder);

// Lab results
router.put('/results/item/:orderItemId', doctorOnly, updateLabResult);

// Patient lab history
router.get('/patient/:patientId/history', doctorOnly, getPatientLabHistory);

// Get patients for selection
router.get('/patients', doctorOnly, getLabPatients);

// AI Chat Integration
router.post('/ai/chat', doctorOnly, labAiChat);

export default router;