import express from 'express';
import authenticateToken from '../../authentification/authentification.js';
import { getTransactionsByUser } from '../../model/transactionModel.js';
import bankingService from '../../services/banking/index.js';
import syncBankTransactions from '../../services/banking/syncTransactions.js';

import {
  createAuthLink,
  bankCallback,
  getAccounts,
  getBankBalance,
  syncTransactions,
  getBankTransactions,
  getConnectionStatus,
} from '../../controller/bankController.js';

const router = express.Router();

router.get('/users/:userId', authenticateToken, async (req, res, next) => {
  try {
    if (String(req.user.id) !== String(req.params.userId)) return res.sendStatus(403);

    const limit = Number(req.query.limit || 100);
    const shouldSync = String(req.query.sync || 'false').toLowerCase() === 'true';

    if (shouldSync) {
      const accessToken = await bankingService.getAccessToken(req.params.userId);
      const accountsResponse = await bankingService.getAccounts(accessToken);
      const accounts = accountsResponse?.results ?? accountsResponse ?? [];

      await Promise.all(
        accounts.map((account) => syncBankTransactions(req.params.userId, account.account_id)),
      );
    }

    const rows = await getTransactionsByUser(req.params.userId, limit);
    return res.json(rows);
  } catch (e) {
    return next(e);
  }
});

/**
 * TrueLayer OAuth
 */
router.get('/link', createAuthLink);

// ⚠️ CALLBACK MUSS GET SEIN (kein Auth, kommt von TrueLayer)
router.get('/callback', bankCallback);

/**
 * Sync single account (optional / advanced)
 */
router.post('/sync/:accountId', authenticateToken, syncTransactions);

/**
 * Data
 */
router.get('/accounts', authenticateToken, getAccounts);
router.get('/status', authenticateToken, getConnectionStatus);
router.get('/balance/:accountId', authenticateToken, getBankBalance);
router.get('/transactions/:accountId', authenticateToken, getBankTransactions);

export default router;
