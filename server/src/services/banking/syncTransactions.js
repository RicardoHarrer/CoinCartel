import bankingService from './index.js';
import autoCategorize from './autoCategorize.js';
import { insertTransaction } from '../../model/transactionModel.js';

const mapTransactionForInsert = (tx, userId, accountId) => {
  const truelayerId = tx.transaction_id || tx.id;
  const description = tx.description || tx.merchant_name || 'Banktransaktion';
  const amount = Number(tx.amount);

  if (!truelayerId || Number.isNaN(amount) || amount === 0) {
    return null;
  }

  return {
    userId,
    categoryId: autoCategorize(tx),
    amount: Math.abs(amount),
    transactionType: amount > 0 ? 'Einnahme' : 'Ausgabe',
    currency: tx.currency || 'EUR',
    date: tx.timestamp || tx.booking_timestamp || new Date().toISOString(),
    description,
    truelayerTransactionId: truelayerId,
    truelayerAccountId: accountId,
    truelayerRaw: tx,
  };
};

const syncBankTransactions = async (userId, accountId) => {
  const accessToken = await bankingService.getAccessToken(userId);
  const fetchedTransactions = await bankingService.getTransactions(accessToken, accountId);

  const tlTxs = Array.isArray(fetchedTransactions)
    ? fetchedTransactions
    : fetchedTransactions?.results || [];

  const mappedTransactions = tlTxs
    .map((tx) => mapTransactionForInsert(tx, userId, accountId))
    .filter(Boolean);

  const insertResults = await Promise.all(
    mappedTransactions.map((mapped) => insertTransaction(mapped)),
  );

  const inserted = insertResults.reduce(
    (count, result) => count + (result ? 1 : 0),
    0,
  );

  return { inserted, fetched: tlTxs.length };
};

export default syncBankTransactions;

