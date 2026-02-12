const mapTrueLayerTransaction = (tlTx, userId) => ({
  truelayer_transaction_id: tlTx.transaction_id,
  user_id: userId,
  amount: tlTx.amount,
  currency: tlTx.currency,
  transaction_type: tlTx.amount < 0 ? 'Ausgabe' : 'Einnahme',
  date: tlTx.timestamp,
  description: tlTx.description || 'Bank transaction',
  category_id: null,
});

export default mapTrueLayerTransaction;
