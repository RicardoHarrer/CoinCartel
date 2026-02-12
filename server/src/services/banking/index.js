import axios from 'axios';
import getTrueLayerUrls from '../../utils/TrueLayerConfig.js';
import { encryptToken, decryptToken } from '../../utils/CryptoTokens.js';
import { saveBankConnection, getBankConnection } from '../../model/bankModel.js';

function createAuthLink(userId) {
  if (!userId) throw new Error('UserId missing');

  const { auth } = getTrueLayerUrls();

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.TL_CLIENT_ID,
    redirect_uri: process.env.TL_REDIRECT_URI,
    scope: 'info accounts balance transactions offline_access',
    providers: 'uk-cs-mock',
    state: userId,
  });

  return `${auth}/?${params.toString()}`;
}

async function exchangeAuthCode(code, userId) {
  const { auth } = getTrueLayerUrls();

  const tokenRes = await axios.post(
    `${auth}/connect/token`,
    new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.TL_CLIENT_ID,
      client_secret: process.env.TL_CLIENT_SECRET,
      redirect_uri: process.env.TL_REDIRECT_URI,
      code,
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
  );

  const { refresh_token: refreshTokenRaw, scope } = tokenRes.data;

  if (!refreshTokenRaw) {
    throw new Error('No refresh_token returned');
  }

  await saveBankConnection({
    userId,
    refreshTokenEnc: encryptToken(refreshTokenRaw),
    scope,
  });
}

async function getAccessToken(userId) {
  const connection = await getBankConnection(userId);
  if (!connection) throw new Error('No bank connected');

  const refreshToken = decryptToken(connection.refresh_token_enc);
  const { auth } = getTrueLayerUrls();

  const tokenRes = await axios.post(
    `${auth}/connect/token`,
    new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: process.env.TL_CLIENT_ID,
      client_secret: process.env.TL_CLIENT_SECRET,
      refresh_token: refreshToken,
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
  );

  return tokenRes.data.access_token;
}

async function getAccounts(accessToken) {
  const { api } = getTrueLayerUrls();
  const res = await axios.get(`${api}/data/v1/accounts`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.data;
}

async function getBalance(accessToken, accountId) {
  const { api } = getTrueLayerUrls();
  const res = await axios.get(
    `${api}/data/v1/accounts/${accountId}/balance`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  return res.data;
}

async function getTransactions(accessToken, accountId, params = {}) {
  const { api } = getTrueLayerUrls();

  const res = await axios.get(
    `${api}/data/v1/accounts/${accountId}/transactions`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { ...params, limit: params.limit ?? 100 },
    },
  );

  return res.data?.results ?? [];
}

export default {
  createAuthLink,
  exchangeAuthCode,
  getAccessToken,
  getAccounts,
  getBalance,
  getTransactions,
};
