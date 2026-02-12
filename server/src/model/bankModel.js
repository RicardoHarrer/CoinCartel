import { query } from '../../boilerplate/db/index.js';

export async function saveBankConnection({
  userId,
  refreshTokenEnc,
  scope,
  connectionId,
}) {
  await query(
    `
    INSERT INTO bank_connections
      (user_id, refresh_token_enc, scope, connection_id)
    VALUES ($1,$2,$3,$4)
    ON CONFLICT (user_id)
    DO UPDATE SET
      refresh_token_enc = EXCLUDED.refresh_token_enc,
      scope = EXCLUDED.scope,
      connection_id = EXCLUDED.connection_id,
      updated_at = NOW()
    `,
    [userId, refreshTokenEnc, scope, connectionId],
  );
}

export async function getBankConnection(userId) {
  const res = await query(
    'SELECT * FROM bank_connections WHERE user_id = $1',
    [userId],
  );
  return res.rows[0];
}
