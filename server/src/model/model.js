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
    // Überprüfen ob die Kategorie existiert
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
};
