import express from 'express';
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
router.post('/init', initiatePayment);
router.get('/mock-checkout', mockCheckout);
router.post('/success', handleSuccess); // SSLCommerz sends a POST to success_url
router.get('/success', handleSuccess);  // Sometimes needed for redirects
router.post('/fail', handleFail);
router.post('/cancel', handleCancel);
router.post('/ipn', handleIPN);

export default router;
