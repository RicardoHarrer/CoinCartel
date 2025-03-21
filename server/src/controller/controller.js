import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import * as model from '../model/model.js';
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

    if (!user) {
      return res.status(400).json({ error: "User doesn't exist" });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(400).json({ error: 'Wrong password' });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    return res.json({
      message: 'Login successful',
      token,
    });
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
  const { userId, categoryId, amount, transactionType, currency, description } = req.body;

  if (!userId || !categoryId || !amount || !transactionType || !currency) {
    res.status(400).send('Missing required fields');
  }

  if (!['Einnahme', 'Ausgabe'].includes(transactionType)) {
    res.status(400).send('Invalid transaction type');
  }

  if (Number.isNaN(amount)) {
    res.status(400).send('Amount must be a number');
  }

  try {
    model.resetTransactionSequence();
    const { rows } = await model.addTransaction(
      userId,
      categoryId,
      amount,
      transactionType,
      currency,
      description,
    );

    if (!rows) {
      res.status(400).send('Could not add transaction');
    }

    res.status(200).send('Transaction successfully added');
  } catch (error) {
    console.error('Error adding transaction:', error);
    res.status(500).send(`Internal server error: ${error.message}`);
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
      res.status(404).send(`No transactions found for user with ID ${id}`);
    }

    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).send('Failed to fetch transactions');
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
};
