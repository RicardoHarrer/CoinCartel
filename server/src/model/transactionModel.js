import { query } from '../../boilerplate/db/index.js';

export async function insertTransaction({
  userId,
  categoryId,
  amount,
  transactionType,
  currency,
  date,
  description,
  truelayerTransactionId = null,
  truelayerAccountId = null,
  truelayerRaw = null,
}) {
  const res = await query(
    `
    INSERT INTO transactions
      (user_id, category_id, amount, transaction_type, currency, date, description,
       truelayer_transaction_id, truelayer_account_id, truelayer_raw)
    VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    ON CONFLICT (user_id, truelayer_transaction_id)
    DO NOTHING
    RETURNING *;
    `,
    [
      userId,
      categoryId,
      amount,
      transactionType,
      currency,
      date,
      description,
      truelayerTransactionId,
      truelayerAccountId,
      truelayerRaw,
    ],
  );

  return res.rows[0] || null; // null wenn schon existiert
}

export async function upsertTransactionFromProvider(t) {
  const res = await query(
    `
    INSERT INTO transactions (
      user_id, category_id, amount, transaction_type, currency, date, description,
      source, provider, provider_account_id, provider_transaction_id, raw
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,'truelayer','truelayer',$8,$9,$10)
    ON CONFLICT (user_id, provider, provider_transaction_id) DO NOTHING
    RETURNING *
    `,
    [
      t.user_id,
      t.category_id,
      t.amount,
      t.transaction_type,
      t.currency,
      t.date,
      t.description,
      t.provider_account_id,
      t.provider_transaction_id,
      t.raw,
    ],
  );

  return res.rows[0] || null;
}

export async function getTransactionsByUser(userId, limit = 1000) {
  const res = await query(
    `
    SELECT *
    FROM transactions
    WHERE user_id = $1
    ORDER BY date DESC
    LIMIT $2
    `,
    [userId, limit],
  );
  return res.rows;
}
