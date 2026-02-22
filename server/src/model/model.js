import axios from 'axios';
import { query } from '../../boilerplate/db/index.js';

const getUsers = () => query('SELECT * from users');

const getUserById = (id) => query('Select * from users where id = $1', [id]);

const getTransactions = () => query('Select * from transactions');

const getCurrencies = () => query('Select * from currencies');

const getUserPreferences = () => query('Select * from user_preferences');

const getCategories = () => query('Select * from categories');

const getCategoryByName = (name) =>
  query('SELECT * FROM categories WHERE LOWER(name) = LOWER($1) LIMIT 1', [name]);

const findUserByUsername = async (username) => {
  const result = await query('SELECT * FROM users WHERE username = $1', [username]);
  return result.rows[0];
};

const createUser = async (username, hashedPassword) => {
  const result = await query('INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *', [
    username,
    hashedPassword,
  ]);
  return result.rows[0];
};

const addCurrency = (code, symbol, name) =>
  query(
    'Insert into currencies (code, symbol, name) values ($1,$2,$3) on conflict (code) do nothing returning *',
    [code, symbol, name],
  );

const addCategory = (name, description) =>
  query('Insert into categories (name, description) values ($1,$2) returning *', [
    name,
    description,
  ]);

const getTransactionByID = (id) => query('Select * from transactions where id = $1', [id]);

const addTransaction = async (
  userId,
  categoryId,
  amount,
  transactionType,
  currency,
  date,
  description,
) => {
  try {
    const categoryCheck = await query('SELECT id FROM categories WHERE id = $1', [categoryId]);
    if (categoryCheck.rows.length === 0) {
      throw new Error('Category does not exist');
    }

    const insertTransactionQuery = `
      INSERT INTO transactions (user_id, category_id, amount, transaction_type, currency, date, description)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    const insertTransactionValues = [
      userId,
      categoryId,
      amount,
      transactionType,
      currency,
      date,
      description,
    ];

    const transactionResult = await query(insertTransactionQuery, insertTransactionValues);

    return transactionResult;
  } catch (error) {
    console.error('Error in addTransaction:', error);
    throw error;
  }
};

const getUserPreferencesByUser = (id) =>
  query('Select * from user_preferences where user_id = $1', [id]);

const deleteTransaction = (id) => query('Delete from transactions where id = $1 returning *', [id]);

const resetTransactionSequence = async () => {
  const seq = await query("SELECT to_regclass('transactions_id_seq') AS seq");
  if (!seq.rows[0]?.seq) {
    return { rows: [] };
  }
  return query(
    `SELECT setval('transactions_id_seq', COALESCE((SELECT MAX(id)+1 FROM transactions),
     1),
     false);`,
  );
};

const resetRegisterSequence = async () => {
  const seq = await query("SELECT to_regclass('users_id_seq') AS seq");
  if (!seq.rows[0]?.seq) {
    return { rows: [] };
  }
  return query(
    `SELECT setval('users_id_seq', COALESCE((SELECT MAX(id)+1 FROM users),
       1),
       false);`,
  );
};

const getTransactionsByUser = (userId, startDate, endDate) => {
  let queryText = 'SELECT * FROM transactions WHERE user_id = $1';
  const queryParams = [userId];

  if (startDate && endDate) {
    queryText += ' AND date >= $2 AND date <= $3';
    queryParams.push(startDate, endDate);
  }

  return query(queryText, queryParams);
};

const updateUserPreferences = async (id, preferredCurrency, saldo) => {
  const updated = await query(
    `UPDATE user_preferences
     SET preferred_currency = $2, saldo = $3
     WHERE user_id = $1
     RETURNING *`,
    [id, preferredCurrency, saldo],
  );

  if (updated.rows && updated.rows.length > 0) {
    return updated.rows[0];
  }

  const inserted = await query(
    `INSERT INTO user_preferences (user_id, preferred_currency, saldo)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [id, preferredCurrency, saldo],
  );

  return inserted.rows[0];
};

const getTransactionsWithCategoriesByUser = async (userId, startDate, endDate) => {
  let queryText = `
    SELECT
      t.*,
      c.name as category_name,
      c.description as category_description
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.user_id = $1
  `;

  const queryParams = [userId];

  if (startDate && endDate) {
    queryText += ' AND t.date >= $2 AND t.date <= $3';
    queryParams.push(startDate, endDate);
  }

  queryText += ' ORDER BY t.date DESC';

  const result = await query(queryText, queryParams);
  return result;
};

const COIN_ID_TO_SYMBOL = {
  bitcoin: 'BTC',
  ethereum: 'ETH',
  solana: 'SOL',
  ripple: 'XRP',
  cardano: 'ADA',
  dogecoin: 'DOGE',
  polkadot: 'DOT',
  litecoin: 'LTC',
  chainlink: 'LINK',
  stellar: 'XLM',
  avalanche: 'AVAX',
  tron: 'TRX',
  aptos: 'APT',
  sui: 'SUI',
};

const QUOTE_TYPE_TO_ASSET_TYPE = {
  cryptocurrency: 'crypto',
  crypto: 'crypto',
  equity: 'stock',
  etf: 'etf',
  mutualfund: 'fund',
  currency: 'forex',
  index: 'index',
  futures: 'commodity',
  commodity: 'commodity',
};

const makeAssetLabel = ({ name, symbol, assetType, exchange }) => {
  const typeLabel = String(assetType || 'asset').toUpperCase();
  const exchangePart = exchange ? ` - ${exchange}` : '';
  return `${name} (${symbol}) - ${typeLabel}${exchangePart}`;
};

const normalizeAssetType = (value = '') =>
  QUOTE_TYPE_TO_ASSET_TYPE[String(value || '').toLowerCase()] || 'asset';

const FALLBACK_WATCHLIST = [
  { symbol: 'BTC-EUR', name: 'Bitcoin', assetType: 'crypto', currency: 'EUR', exchange: 'CCC' },
  { symbol: 'ETH-EUR', name: 'Ethereum', assetType: 'crypto', currency: 'EUR', exchange: 'CCC' },
  { symbol: 'SOL-EUR', name: 'Solana', assetType: 'crypto', currency: 'EUR', exchange: 'CCC' },
  { symbol: 'AAPL', name: 'Apple', assetType: 'stock', currency: 'USD', exchange: 'NASDAQ' },
  { symbol: 'MSFT', name: 'Microsoft', assetType: 'stock', currency: 'USD', exchange: 'NASDAQ' },
  { symbol: 'NVDA', name: 'NVIDIA', assetType: 'stock', currency: 'USD', exchange: 'NASDAQ' },
  { symbol: 'TSLA', name: 'Tesla', assetType: 'stock', currency: 'USD', exchange: 'NASDAQ' },
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF', assetType: 'etf', currency: 'USD', exchange: 'NYSE' },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust', assetType: 'etf', currency: 'USD', exchange: 'NASDAQ' },
  { symbol: 'VWCE.DE', name: 'Vanguard FTSE All-World UCITS ETF', assetType: 'etf', currency: 'EUR', exchange: 'XETRA' },
  { symbol: 'EURUSD=X', name: 'EUR/USD', assetType: 'forex', currency: 'USD', exchange: 'FX' },
  { symbol: 'GBPUSD=X', name: 'GBP/USD', assetType: 'forex', currency: 'USD', exchange: 'FX' },
  { symbol: 'USDJPY=X', name: 'USD/JPY', assetType: 'forex', currency: 'JPY', exchange: 'FX' },
  { symbol: '^GSPC', name: 'S&P 500', assetType: 'index', currency: 'USD', exchange: 'INDEX' },
  { symbol: '^NDX', name: 'NASDAQ 100', assetType: 'index', currency: 'USD', exchange: 'INDEX' },
].map((asset) => ({
  ...asset,
  value: asset.symbol,
  label: makeAssetLabel(asset),
}));

const parseYahooChartResult = (result, fallbackSymbol) => {
  const timestamps = Array.isArray(result?.timestamp) ? result.timestamp : [];
  const quote = result?.indicators?.quote?.[0] || {};
  const highs = Array.isArray(quote?.high) ? quote.high : [];
  const lows = Array.isArray(quote?.low) ? quote.low : [];
  const closes = Array.isArray(quote?.close) ? quote.close : [];
  const opens = Array.isArray(quote?.open) ? quote.open : [];
  const volumes = Array.isArray(quote?.volume) ? quote.volume : [];
  const meta = result?.meta || {};

  const prices = [];
  const candles = [];
  const totalVolumes = [];
  const seenTimestamps = new Set();
  for (let i = 0; i < timestamps.length; i += 1) {
    const ts = Number(timestamps[i]) * 1000;
    if (!Number.isFinite(ts) || seenTimestamps.has(ts)) continue;

    const close = Number(closes[i]);
    const open = Number(opens[i]);
    const high = Number(highs[i]);
    const low = Number(lows[i]);
    const value = Number.isFinite(close) ? close : open;
    if (!Number.isFinite(value) || value <= 0) continue;

    const candleOpen = Number.isFinite(open) && open > 0 ? open : value;
    const candleClose = Number.isFinite(close) && close > 0 ? close : value;
    const candleHigh = Math.max(
      ...[high, candleOpen, candleClose].filter((point) => Number.isFinite(point) && point > 0),
    );
    const candleLow = Math.min(
      ...[low, candleOpen, candleClose].filter((point) => Number.isFinite(point) && point > 0),
    );

    prices.push([ts, value]);
    candles.push([ts, candleOpen, candleClose, candleLow, candleHigh]);
    const vol = Number(volumes[i]);
    totalVolumes.push([ts, Number.isFinite(vol) && vol > 0 ? vol : 0]);
    seenTimestamps.add(ts);
  }

  const symbol = meta.symbol || fallbackSymbol;
  return {
    prices,
    candles,
    total_volumes: totalVolumes,
    asset: {
      symbol,
      name: meta.longName || meta.shortName || symbol,
      assetType: normalizeAssetType(meta.instrumentType || meta.quoteType),
      currency: meta.currency || 'USD',
      exchange: meta.exchangeName || meta.fullExchangeName || '',
    },
    providerMeta: {
      interval: meta.dataGranularity || '',
      timezone: meta.exchangeTimezoneName || meta.timezone || '',
      marketState: meta.marketState || '',
    },
  };
};

const MIN_POINTS_BY_INTERVAL = {
  '1m': 80,
  '2m': 60,
  '5m': 48,
  '15m': 28,
  '30m': 20,
  '60m': 14,
  '90m': 12,
  '1h': 14,
  '1d': 5,
};

const getMinimumPointTarget = (interval = '') =>
  MIN_POINTS_BY_INTERVAL[String(interval || '').toLowerCase()] || 12;

const buildYahooRequestPlan = (range = '1d', interval = '5m') => {
  const requested = {
    range: String(range || '1d').trim() || '1d',
    interval: String(interval || '5m').trim() || '5m',
  };

  const fallbackPlan = [
    { range: '5d', interval: '5m' },
    { range: '1mo', interval: '15m' },
    { range: '3mo', interval: '60m' },
    { range: '6mo', interval: '1d' },
  ];

  const plan = [requested];
  fallbackPlan.forEach((candidate) => {
    if (
      !plan.some(
        (existing) =>
          existing.range === candidate.range && existing.interval === candidate.interval,
      )
    ) {
      plan.push(candidate);
    }
  });

  return plan;
};

const fetchYahooChart = async (symbol, { range = '1d', interval = '5m' } = {}) => {
  const normalizedSymbol = String(symbol || '').trim();
  if (!normalizedSymbol) {
    throw new Error('Missing symbol');
  }

  const allowedIntervals = new Set(['1m', '2m', '5m', '15m', '30m', '60m', '90m', '1h', '1d']);
  const safeInterval = allowedIntervals.has(interval) ? interval : '5m';
  const safeRange = String(range || '1d').trim() || '1d';
  const requestPlan = buildYahooRequestPlan(safeRange, safeInterval);

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(normalizedSymbol)}`;
  let lastError = null;
  let bestParsed = null;
  let bestAttempt = null;

  for (let i = 0; i < requestPlan.length; i += 1) {
    const attempt = requestPlan[i];
    try {
      const response = await axios.get(url, {
        params: {
          range: attempt.range,
          interval: attempt.interval,
          includePrePost: false,
        },
        timeout: 10000,
      });

      const result = response?.data?.chart?.result?.[0];
      if (!result) {
        const details = response?.data?.chart?.error?.description || 'No chart result';
        throw new Error(`Yahoo chart error for ${normalizedSymbol}: ${details}`);
      }

      const parsed = parseYahooChartResult(result, normalizedSymbol);
      if (!parsed.prices.length) {
        throw new Error(`No market data points available for ${normalizedSymbol}`);
      }

      const minPoints = getMinimumPointTarget(attempt.interval);
      const isSparse = parsed.prices.length < minPoints;
      bestParsed = parsed;
      bestAttempt = attempt;
      if (!isSparse) {
        return {
          ...parsed,
          requested: { range: safeRange, interval: safeInterval },
          resolved: {
            range: attempt.range,
            interval: parsed.providerMeta?.interval || attempt.interval,
          },
        };
      }
    } catch (error) {
      lastError = error;
    }
  }

  if (bestParsed && bestAttempt) {
    return {
      ...bestParsed,
      requested: { range: safeRange, interval: safeInterval },
      resolved: {
        range: bestAttempt.range,
        interval: bestParsed.providerMeta?.interval || bestAttempt.interval,
      },
    };
  }

  throw new Error(
    `Yahoo chart error for ${normalizedSymbol}: ${lastError?.message || 'No chart result'}`,
  );
};

const fetchCryptoDataFromYahoo = async (coin) => {
  const symbol = COIN_ID_TO_SYMBOL[String(coin || '').toLowerCase()];
  if (!symbol) {
    throw new Error(`No Yahoo symbol mapping found for coin: ${coin}`);
  }

  return fetchYahooChart(`${symbol}-EUR`, { range: '1d', interval: '5m' });
};

const mapYahooSearchQuote = (quote = {}) => {
  const symbol = String(quote.symbol || '').trim();
  if (!symbol) return null;

  const name = quote.shortname || quote.longname || quote.symbol;
  const assetType = normalizeAssetType(
    quote.quoteType || quote.typeDisp || quote.instrumentType || quote.quoteSourceName,
  );
  const exchange = quote.exchDisp || quote.exchange || quote.exchangeDisplay || '';
  const currency = quote.currency || quote.financialCurrency || 'USD';

  const mapped = {
    value: symbol,
    symbol,
    name,
    assetType,
    exchange,
    currency,
  };

  return {
    ...mapped,
    label: makeAssetLabel(mapped),
  };
};

export const searchMarketAssets = async (queryText = '', limit = 40) => {
  const queryValue = String(queryText || '').trim();
  const normalizedLimit = Math.max(1, Math.min(100, Number(limit) || 40));

  if (!queryValue) {
    return FALLBACK_WATCHLIST.slice(0, normalizedLimit);
  }

  try {
    const response = await axios.get('https://query1.finance.yahoo.com/v1/finance/search', {
      params: {
        q: queryValue,
        quotesCount: Math.max(20, normalizedLimit),
        newsCount: 0,
        enableFuzzyQuery: false,
      },
      timeout: 10000,
    });

    const quotes = Array.isArray(response?.data?.quotes) ? response.data.quotes : [];
    const mapped = quotes
      .map((quote) => mapYahooSearchQuote(quote))
      .filter(Boolean);

    if (mapped.length) {
      return mapped.slice(0, normalizedLimit);
    }
  } catch (error) {
    console.error('Error searching market assets:', error.message);
  }

  const qLower = queryValue.toLowerCase();
  return FALLBACK_WATCHLIST
    .filter(
      (item) =>
        item.label.toLowerCase().includes(qLower)
        || item.symbol.toLowerCase().includes(qLower)
        || item.name.toLowerCase().includes(qLower),
    )
    .slice(0, normalizedLimit);
};

export const getMarketWatchlist = async (limit = 20) => {
  const normalizedLimit = Math.max(1, Math.min(100, Number(limit) || 20));
  return FALLBACK_WATCHLIST.slice(0, normalizedLimit);
};

export const fetchMarketData = async (symbol, options = {}) =>
  fetchYahooChart(symbol, options);

export const fetchCryptoData = async (coin) => {
  const url = `https://api.coingecko.com/api/v3/coins/${coin}/market_chart`;
  try {
    console.log('Fetching CoinGecko URL:', url);
    const response = await axios.get(url, {
      params: { vs_currency: 'eur', days: 1 },
      timeout: 10000,
    });
    return response.data;
  } catch (err) {
    const status = err.response?.status;
    const details = err.response?.data || err.message;
    const detailsText = String(details || '').toLowerCase();
    const isOpenDnsBlock = status === 403 && detailsText.includes('block.opendns.com');
    const isTlsIssue = (
      err.code === 'UNABLE_TO_GET_ISSUER_CERT_LOCALLY'
      || err.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE'
      || err.code === 'SELF_SIGNED_CERT_IN_CHAIN'
    );

    console.error(`Error fetching ${coin}:`, status ?? err.code, details);

    if (isOpenDnsBlock || isTlsIssue || status === 429 || status >= 500) {
      console.warn(`Using Yahoo fallback for ${coin}.`);
      return fetchCryptoDataFromYahoo(coin);
    }

    throw new Error(`Error fetching ${coin}: ${err.message}`);
  }
};

const getGoalsByUser = (userId) =>
  query('SELECT * FROM goals WHERE user_id = $1 ORDER BY target_date ASC', [userId]);

const getGoalById = (id) => query('SELECT * FROM goals WHERE id = $1', [id]);

const addGoal = async (
  userId,
  title,
  targetAmount,
  currentAmount,
  targetDate,
  categoryId,
  description,
) => {
  const { rows } = await query(
    `INSERT INTO goals (user_id, title, target_amount, current_amount, target_date, category_id, description)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [userId, title, targetAmount, currentAmount || 0, targetDate, categoryId, description],
  );
  return rows[0];
};

const updateGoal = async (
  id,
  title,
  targetAmount,
  currentAmount,
  targetDate,
  categoryId,
  description,
) => {
  const { rows } = await query(
    `UPDATE goals
     SET title = $1, target_amount = $2, current_amount = $3, target_date = $4, category_id = $5, description = $6, updated_at = CURRENT_TIMESTAMP
     WHERE id = $7
     RETURNING *`,
    [title, targetAmount, currentAmount, targetDate, categoryId, description, id],
  );
  return rows[0];
};

const updateGoalProgress = async (id, currentAmount) => {
  const { rows } = await query(
    'UPDATE goals SET current_amount = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
    [currentAmount, id],
  );
  return rows[0];
};

const deleteGoal = (id) => query('DELETE FROM goals WHERE id = $1 RETURNING *', [id]);

const resetGoalSequence = () =>
  query("SELECT setval('goals_id_seq', COALESCE((SELECT MAX(id)+1 FROM goals), 1), false)");

const getGoalProgress = async (userId) => {
  const { rows } = await query(
    `SELECT
      g.*,
      c.name as category_name,
      (g.current_amount / g.target_amount * 100) as progress_percentage,
      CASE
        WHEN g.current_amount >= g.target_amount THEN 'completed'
        WHEN g.target_date < CURRENT_DATE THEN 'overdue'
        ELSE 'in_progress'
      END as status
     FROM goals g
     LEFT JOIN categories c ON g.category_id = c.id
     WHERE g.user_id = $1
     ORDER BY g.target_date ASC`,
    [userId],
  );
  return rows;
};

export {
  getUsers,
  getUserById,
  findUserByUsername,
  createUser,
  getTransactions,
  getCurrencies,
  addCurrency,
  getCategories,
  getCategoryByName,
  addCategory,
  getTransactionsByUser,
  getTransactionByID,
  addTransaction,
  getUserPreferences,
  getUserPreferencesByUser,
  deleteTransaction,
  resetTransactionSequence,
  resetRegisterSequence,
  updateUserPreferences,
  getTransactionsWithCategoriesByUser,
  getGoalsByUser,
  getGoalById,
  addGoal,
  updateGoal,
  updateGoalProgress,
  deleteGoal,
  resetGoalSequence,
  getGoalProgress,
};
