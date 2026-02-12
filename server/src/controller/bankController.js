import bankingService from '../services/banking/index.js';
import syncBankTransactions from '../services/banking/syncTransactions.js';
import { getBankConnection } from '../model/bankModel.js';

export const syncTransactions = async (req, res, next) => {
  try {
    const result = await syncBankTransactions(req.user.id, req.params.accountId);
    return res.json({ status: 'ok', ...result });
  } catch (err) {
    return next(err);
  }
};

const createAuthLink = (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }

  const url = bankingService.createAuthLink(userId);
  return res.redirect(url);
};

const getAccounts = async (req, res, next) => {
  try {
    const token = await bankingService.getAccessToken(req.user.id);
    const accounts = await bankingService.getAccounts(token);
    return res.json(accounts);
  } catch (err) {
    return next(err);
  }
};

const getBankBalance = async (req, res, next) => {
  try {
    const token = await bankingService.getAccessToken(req.user.id);
    const balance = await bankingService.getBalance(
      token,
      req.params.accountId,
    );
    return res.json(balance);
  } catch (err) {
    return next(err);
  }
};

const getBankTransactions = async (req, res, next) => {
  try {
    const token = await bankingService.getAccessToken(req.user.id);
    const transactions = await bankingService.getTransactions(
      token,
      req.params.accountId,
    );
    return res.json(transactions);
  } catch (err) {
    return next(err);
  }
};

const getConnectionStatus = async (req, res, next) => {
  try {
    const connection = await getBankConnection(req.user.id);
    return res.json({ connected: Boolean(connection) });
  } catch (err) {
    return next(err);
  }
};

const bankCallback = async (req, res, next) => {
  try {
    const { code, state } = req.query;

    if (!code) return res.status(400).json({ error: 'Missing code' });
    if (!state) {
      return res.status(400).json({
        error: 'Missing state. Use /api/bank/link?userId=... (do not use console link builder).',
      });
    }

    const userId = state;
    await bankingService.exchangeAuthCode(code, userId);

    return res.redirect('http://localhost:8080/#/bank-import?bank=connected');
  } catch (err) {
    return next(err);
  }
};

export {
  createAuthLink,
  getAccounts,
  getBankBalance,
  getBankTransactions,
  getConnectionStatus,
  bankCallback,
};
