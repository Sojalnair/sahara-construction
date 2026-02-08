const express = require('express');
const {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense
} = require('../controllers/expenseController');
const { authenticate, checkRole } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticate, checkRole('Admin', 'Accountant'), createExpense);
router.get('/', authenticate, getExpenses);
router.get('/:id', authenticate, getExpenseById);
router.put('/:id', authenticate, checkRole('Admin', 'Accountant'), updateExpense);
router.delete('/:id', authenticate, checkRole('Admin'), deleteExpense);

module.exports = router;
