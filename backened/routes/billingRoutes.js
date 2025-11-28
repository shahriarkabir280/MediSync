import express from 'express';
import {
  getBillingRecords,
  createBillingRecord,
  updateBillingRecord,
  markAsPaid,
  getBillingSummary
} from '../controllers/billingController.js';

const router = express.Router();

// Billing routes
router.get('/doctor/:doctorId', getBillingRecords);
router.get('/doctor/:doctorId/summary', getBillingSummary);
router.post('/doctor/:doctorId', createBillingRecord);
router.put('/:billingId', updateBillingRecord);
router.patch('/:billingId/mark-paid', markAsPaid);

export default router;
