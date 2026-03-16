import express from 'express';
import { 
  getWalletSummary, 
  getTransactions, 
  requestWithdrawal,
  getRevenueRules,
  updateRevenueRule
} from '../controllers/walletController.js';

const router = express.Router();

// Wallet routes
router.get('/doctor/:doctorId/summary', getWalletSummary);
router.get('/doctor/:doctorId/transactions', getTransactions);
router.post('/doctor/:doctorId/withdraw', requestWithdrawal);

// Rule management
router.get('/rules', getRevenueRules);
router.put('/rules/:id', updateRevenueRule);

export default router;
