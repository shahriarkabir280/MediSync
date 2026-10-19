import express from 'express';
import { doctorOnly, requireOwnDoctor } from '../middleware/auth.js';
import { 
  getWalletSummary, 
  getTransactions, 
  requestWithdrawal,
  getRevenueRules,
  updateRevenueRule
} from '../controllers/walletController.js';

const router = express.Router();
router.use(doctorOnly);

// Wallet routes
router.get('/doctor/:doctorId/summary', requireOwnDoctor(), getWalletSummary);
router.get('/doctor/:doctorId/transactions', requireOwnDoctor(), getTransactions);
router.post('/doctor/:doctorId/withdraw', requireOwnDoctor(), requestWithdrawal);

// Rule management
router.get('/rules', getRevenueRules);
router.put('/rules/:id', updateRevenueRule);

export default router;
