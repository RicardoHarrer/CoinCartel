import axios from 'axios';
import { query } from '../../boilerplate/db/index.js';

// eslint-disable-next-line import/prefer-default-export
const getUsers = () => query('SELECT * from users');

const getUserById = (id) => query('Select * from users where id = $1', [id]);

const getTransactions = () => query('Select * from transactions');

const getCurrencies = () => query('Select * from currencies');

const getUserPreferences = () => query('Select * from user_preferences');

const getCategories = () => query('Select * from categories');

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

const resetTransactionSequence = () =>
  query(
    `SELECT setval('transactions_id_seq', COALESCE((SELECT MAX(id)+1 FROM transactions),
     1),
     false);`,
  );

const resetRegisterSequence = () =>
  query(
    `SELECT setval('users_id_seq', COALESCE((SELECT MAX(id)+1 FROM users),
       1),
       false);`,
  );

const getTransactionsByUser = (userId, startDate, endDate) => {
  let queryText = 'SELECT * FROM transactions WHERE user_id = $1';
  const queryParams = [userId];

  if (startDate && endDate) {
    queryText += ' AND date >= $2 AND date <= $3';
    queryParams.push(startDate, endDate);
  }

  return query(queryText, queryParams);
};

const updateUserPreferences = async (id, preferred_currency, saldo) => {
  const { rows } = await query(
    `INSERT INTO user_preferences (user_id, preferred_currency, saldo)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id)
     DO UPDATE SET preferred_currency = $2, saldo = $3
     RETURNING *`,
    [id, preferred_currency, saldo],
  );
  return rows[0];
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

export const fetchCryptoData = async (coin) => {
  try {
    const url = `https://api.coingecko.com/api/v3/coins/${coin}/market_chart`;
    console.log('Fetching CoinGecko URL:', url);
    const response = await axios.get(url, {
      params: { vs_currency: 'eur', days: 1 },
    });
    return response.data;
  } catch (err) {
    console.error(
      `Fehler beim Abrufen von ${coin}:`,
      err.response?.status,
      err.response?.data || err.message,
    );
    throw new Error(`Fehler beim Abrufen von ${coin}: ${err.message}`);
  }
};

// Goals Funktionen
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

// Goal Progress Berechnung
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
