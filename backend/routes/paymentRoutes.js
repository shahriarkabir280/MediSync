import express from 'express';
import { doctorOnly } from '../middleware/auth.js';
import { 
  initiatePayment, 
  handleSuccess, 
  handleFail, 
  handleCancel, 
  handleIPN,
  mockCheckout
} from '../controllers/paymentController.js';

const router = express.Router();

// Payment routes
router.post('/init', doctorOnly, initiatePayment);

// Public: SSLCommerz redirects and server-to-server callbacks
router.get('/mock-checkout', mockCheckout);
router.post('/success', handleSuccess); // SSLCommerz sends a POST to success_url
router.get('/success', handleSuccess);  // Sometimes needed for redirects
router.post('/fail', handleFail);
router.post('/cancel', handleCancel);
router.post('/ipn', handleIPN);

export default router;
