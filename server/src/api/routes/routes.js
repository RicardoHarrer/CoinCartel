import express from 'express';
import asyncHandler from 'express-async-handler';
import {
  getUsers,
  getUserById,
  registerUser,
  loginUser,
  getTransactions,
  getCurrencies,
  addCurrency,
  getCategories,
  addCategory,
  getTransactionsByUser,
  getTransactionByID,
  addTransaction,
  getUserPreferences,
  getUserPreferencesByUser,
  deleteTransaction,
  updateUserPreferences,
  getTransactionsWithCategoriesByUser,
  getCryptoData,
  getMarketData,
  searchMarketAssetsEndpoint,
  getMarketWatchlistEndpoint,
  getGoalsByUser,
  getGoalProgress,
  createGoal,
  updateGoal,
  updateGoalAmount,
  deleteGoal,
} from '../../controller/controller.js';
import { getTipsForUser } from '../../controller/tipscontroller.js';

const router = express.Router();

router.get('/users', asyncHandler(getUsers));

router.get('/users/:id', asyncHandler(getUserById));

router.post('/register', asyncHandler(registerUser));

router.post('/login', asyncHandler(loginUser));

router.get('/transactions', asyncHandler(getTransactions));

router.get('/currencies', asyncHandler(getCurrencies));

router.post('/currencies', asyncHandler(addCurrency));

router.get('/categories', asyncHandler(getCategories));

router.post('/categories', asyncHandler(addCategory));

router.get('/transactions/users/:id', asyncHandler(getTransactionsByUser));

router.get('/transactions/:id', asyncHandler(getTransactionByID));

router.post('/transactions', asyncHandler(addTransaction));

router.get('/preferences', asyncHandler(getUserPreferences));

router.get('/preferences/:id', asyncHandler(getUserPreferencesByUser));

router.delete('/transactions/:id', asyncHandler(deleteTransaction));

router.patch('/preferences/:id', asyncHandler(updateUserPreferences));

router.get(
  '/transactions-with-categories/users/:id',
  asyncHandler(getTransactionsWithCategoriesByUser),
);
router.get('/api/market/watchlist', asyncHandler(getMarketWatchlistEndpoint));
router.get('/api/market/search', asyncHandler(searchMarketAssetsEndpoint));
router.get('/api/market/:symbol', asyncHandler(getMarketData));
router.get('/api/crypto/:coin', asyncHandler(getCryptoData));
router.get('/api/tips/:id', asyncHandler(getTipsForUser));

router.get('/api/goals/user/:id', asyncHandler(getGoalsByUser));
router.get('/api/goals/progress/:id', asyncHandler(getGoalProgress));
router.post('/api/goals', asyncHandler(createGoal));
router.put('/api/goals/:id', asyncHandler(updateGoal));
router.patch('/api/goals/:id/amount', asyncHandler(updateGoalAmount));
router.delete('/api/goals/:id', asyncHandler(deleteGoal));

export default router;
