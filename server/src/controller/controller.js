/* eslint-disable operator-linebreak */
/* eslint-disable consistent-return */
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import * as model from '../model/model.js';
import { fetchCryptoData } from '../model/model.js';

// eslint-disable-next-line import/prefer-default-export

const getUsers = async (req, res) => {
  const { rows } = await model.getUsers();
  if (!rows) {
    res.status(400).send('Could not find a User');
  }

  res.status(200).json(rows);
};

const getUserById = async (req, res) => {
  const { id } = req.params;
  const { rows } = await model.getUserById(id);
  if (!rows) {
    res.status(400).send(`No user with id ${id} found`);
  }

  res.status(200).json(rows);
};

const registerUser = async (req, res) => {
  const { username, password } = req.body;

  try {
    const existingUser = await model.findUserByUsername(username);

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await model.resetRegisterSequence();
    const newUser = await model.createUser(username, hashedPassword);

    const token = jwt.sign({ id: newUser.id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    return res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: newUser.id, username: newUser.username },
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ error: 'Server error' });
  }
};

const loginUser = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await model.findUserByUsername(username);
    if (!user) return res.status(400).json({ error: "User doesn't exist" });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Wrong password' });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    return res.json({ token });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ error: 'Server error' });
  }
};

const getTransactions = async (req, res) => {
  const { rows } = await model.getTransactions();
  if (!rows) {
    res.status(400).send('No Transactions found');
  }

  res.status(200).json(rows);
};

const getCurrencies = async (req, res) => {
  const { rows } = await model.getCurrencies();
  if (!rows) {
    res.status(400).send('No Currencies found');
  }

  res.status(200).json(rows);
};

const addCurrency = async (req, res) => {
  const { code, symbol, name } = req.body;
  const { rows } = await model.addCurrency(code, symbol, name);
  if (!rows) {
    res.status(400).send(`Couldn't add currency ${name}`);
  }

  res.status(200).send(`Currency ${name} succesfully added`);
};

const getCategories = async (req, res) => {
  const { rows } = await model.getCategories();
  if (!rows) {
    res.status(400).send('Could not find any currencies');
  }

  res.status(200).json(rows);
};

const addCategory = async (req, res) => {
  const { name, description } = req.body;
  const { rows } = await model.addCategory(name, description);
  if (!rows) {
    res.status(400).send(`Couldn't add category ${name}`);
  }

  res.status(200).send(`Category ${name} succesfully added`);
};

const getTransactionByID = async (req, res) => {
  const { id } = req.params;
  const { rows } = await model.getTransactionByID(id);
  if (!rows) {
    res.status(400).send(`Couldn't find Transaction with id ${id}`);
  }
  res.status(200).json(rows);
};

const addTransaction = async (req, res) => {
  const { userId, categoryId, amount, transactionType, currency, date, description } = req.body;

  // Validierung
  if (!userId || !categoryId || !amount || !transactionType || !currency) {
    return res.status(400).send('Missing required fields');
  }

  if (!['Einnahme', 'Ausgabe'].includes(transactionType)) {
    return res.status(400).send('Invalid transaction type');
  }

  if (Number.isNaN(Number(amount))) {
    return res.status(400).send('Amount must be a number');
  }

  try {
    await model.resetTransactionSequence();
    const { rows } = await model.addTransaction(
      userId,
      categoryId,
      amount,
      transactionType,
      currency,
      date,
      description,
    );

    if (!rows) {
      return res.status(400).send('Could not add transaction');
    }

    return res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error adding transaction:', error);
    if (error.message === 'Category does not exist') {
      return res.status(400).send(error.message);
    }
    return res.status(500).send(`Internal server error: ${error.message}`);
  }
};

const getUserPreferences = async (req, res) => {
  const { rows } = await model.getUserPreferences();
  if (!rows) {
    res.status(400).send('Could not find any Preferences');
  }
  res.status(200).json(rows);
};

const getUserPreferencesByUser = async (req, res) => {
  const { id } = req.params;
  const { rows } = await model.getUserPreferencesByUser(id);
  if (!rows) {
    res.status(400).send(`Could not find Preferences for the User with id ${id}`);
  }
  res.status(200).json(rows);
};

const deleteTransaction = async (req, res) => {
  const { id } = req.params;
  const { rows } = await model.deleteTransaction(id);
  await model.resetTransactionSequence();
  if (!rows) {
    res.status(400).send(`Failed to delete Transaction with id ${id}`);
  }
  res.status(200).json(rows[0]);
};

const getTransactionsByUser = async (req, res) => {
  const { id } = req.params;
  const { startDate, endDate } = req.query;

  try {
    const { rows } = await model.getTransactionsByUser(id, startDate, endDate);

    if (!rows || rows.length === 0) {
      return res.status(200).json([]);
    }

    return res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return res.status(500).send('Failed to fetch transactions');
  }
};

const updateUserPreferences = async (req, res) => {
  try {
    const { id } = req.params;
    const { preferred_currency: preferredCurrency, saldo } = req.body;

    console.log('Updating preferences:', { id, preferredCurrency, saldo });

    if (!id || preferredCurrency === undefined || saldo === undefined) {
      return res.status(400).json({
        error: 'Missing required fields',
        received: req.body,
      });
    }

    const updatedPreferences = await model.updateUserPreferences(id, preferredCurrency, saldo);

    if (!updatedPreferences) {
      return res.status(404).json({ error: 'User preferences not found' });
    }

    return res.json(updatedPreferences);
  } catch (error) {
    console.error('Detailed error:', error);
    return res.status(500).json({
      error: 'Database operation failed',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

const getTransactionsWithCategoriesByUser = async (req, res) => {
  const { id } = req.params;
  const { startDate, endDate } = req.query;

  try {
    const { rows } = await model.getTransactionsWithCategoriesByUser(id, startDate, endDate);

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: `No transactions found for user with ID ${id}` });
    }

    return res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching transactions with categories:', error);
    return res.status(500).json({ error: 'Failed to fetch transactions with categories' });
  }
};

export const getCryptoData = async (req, res) => {
  const { coin } = req.params;
  try {
    const data = await fetchCryptoData(coin);
    res.status(200).json(data);
  } catch (err) {
    console.error('Server Error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// Goals Controller Funktionen
const getGoalsByUser = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await model.getGoalsByUser(id);
    if (!rows) {
      return res.status(404).send(`No goals found for user with ID ${id}`);
    }
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching goals:', error);
    res.status(500).send('Failed to fetch goals');
  }
};

const getGoalProgress = async (req, res) => {
  const { id } = req.params;
  try {
    const goals = await model.getGoalProgress(id);
    if (!goals) {
      return res.status(404).send(`No goals found for user with ID ${id}`);
    }
    res.status(200).json(goals);
  } catch (error) {
    console.error('Error fetching goal progress:', error);
    res.status(500).send('Failed to fetch goal progress');
  }
};

const createGoal = async (req, res) => {
  const { userId, title, targetAmount, currentAmount, targetDate, categoryId, description } =
    req.body;

  // Validierung
  if (!userId || !title || !targetAmount || !targetDate) {
    return res.status(400).send('Missing required fields: userId, title, targetAmount, targetDate');
  }

  if (Number.isNaN(Number(targetAmount)) || Number(targetAmount) <= 0) {
    return res.status(400).send('Target amount must be a positive number');
  }

  try {
    await model.resetGoalSequence();
    const goal = await model.addGoal(
      userId,
      title,
      parseFloat(targetAmount),
      parseFloat(currentAmount) || 0,
      targetDate,
      categoryId,
      description,
    );

    res.status(201).json(goal);
  } catch (error) {
    console.error('Error creating goal:', error);
    res.status(500).send(`Failed to create goal: ${error.message}`);
  }
};

const updateGoal = async (req, res) => {
  const { id } = req.params;
  const { title, targetAmount, currentAmount, targetDate, categoryId, description } = req.body;

  try {
    const goal = await model.updateGoal(
      id,
      title,
      parseFloat(targetAmount),
      parseFloat(currentAmount),
      targetDate,
      categoryId,
      description,
    );

    if (!goal) {
      return res.status(404).send(`Goal with ID ${id} not found`);
    }

    res.status(200).json(goal);
  } catch (error) {
    console.error('Error updating goal:', error);
    res.status(500).send(`Failed to update goal: ${error.message}`);
  }
};

const updateGoalAmount = async (req, res) => {
  const { id } = req.params;
  const { currentAmount } = req.body;

  if (currentAmount === undefined || Number.isNaN(Number(currentAmount))) {
    return res.status(400).send('Current amount is required and must be a number');
  }

  try {
    const goal = await model.updateGoalProgress(id, parseFloat(currentAmount));
    if (!goal) {
      return res.status(404).send(`Goal with ID ${id} not found`);
    }
    res.status(200).json(goal);
  } catch (error) {
    console.error('Error updating goal amount:', error);
    res.status(500).send(`Failed to update goal amount: ${error.message}`);
  }
};

const deleteGoal = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await model.deleteGoal(id);
    await model.resetGoalSequence();
    if (!rows || rows.length === 0) {
      return res.status(404).send(`Goal with ID ${id} not found`);
    }
    res.status(200).json({ message: 'Goal deleted successfully', goal: rows[0] });
  } catch (error) {
    console.error('Error deleting goal:', error);
    res.status(500).send(`Failed to delete goal: ${error.message}`);
  }
};

export {
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
  getGoalsByUser,
  getGoalProgress,
  createGoal,
  updateGoal,
  updateGoalAmount,
  deleteGoal,
};
