import express from 'express';
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

// Lab dashboard and statistics
router.get('/stats', getLabStats);
router.get('/recent', getRecentLabOrders);
router.get('/reviews/pending', getPendingReviews);

// Lab search and filtering
router.get('/search', searchLabOrders);
router.get('/filter', getFilteredLabOrders);

router.get('/report/:orderId', getLabReport);
router.put('/report/:orderId/file', upload.single('file'), updateLabReportFile);

// Lab test categories and tests
router.get('/categories', getLabCategories);
router.get('/tests', getLabTests);

// Lab orders
router.post('/orders', createLabOrder);
router.get('/orders/all', getAllLabOrders); // Must be before /orders/:orderId to avoid matching params
router.get('/orders/doctor/:doctorId', getLabOrders);
router.get('/orders/:orderId', getLabOrderDetails);
router.put('/orders/:orderId', updateLabOrder);
router.put('/orders/:orderId/status', updateLabOrderStatus);
router.post('/orders/:orderId/report', upload.single('file'), uploadLabReportFile);
router.post('/orders/item/:orderItemId/report', upload.single('file'), uploadLabOrderItemReport);
router.put('/orders/:orderId/verify', verifyLabResultsForOrder);
router.delete('/orders/:orderId', deleteLabOrder);

// Lab results
router.put('/results/item/:orderItemId', updateLabResult);

// Patient lab history
router.get('/patient/:patientId/history', getPatientLabHistory);

// Get patients for selection
router.get('/patients', getLabPatients);

// AI Chat Integration
router.post('/ai/chat', labAiChat);

export default router;