const Expense = require('../models/Expense');
const Employee = require('../models/Employee');

// Create expense
exports.createExpense = async (req, res) => {
  try {
    const expense = await Expense.create(req.body);
    
    // If it's a labour expense with an employee, update employee's totalAdvance
    if (expense.category === 'Labour' && expense.employee) {
      await Employee.findByIdAndUpdate(
        expense.employee,
        { $inc: { totalAdvance: expense.amount } }
      );
    }
    
    const populatedExpense = await Expense.findById(expense._id)
      .populate('site', 'name location')
      .populate('employee', 'name phone role');
    
    res.status(201).json({ success: true, data: populatedExpense });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get expenses
exports.getExpenses = async (req, res) => {
  try {
    const { site, category, startDate, endDate, paymentStatus } = req.query;
    const filter = {};
    
    if (site) filter.site = site;
    if (category) filter.category = category;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const expenses = await Expense.find(filter)
      .populate('site', 'name location')
      .populate('employee', 'name phone role')
      .sort({ date: -1 });

    const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    res.status(200).json({ 
      success: true, 
      count: expenses.length, 
      total,
      data: expenses 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get expense by ID
exports.getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id).populate('site', 'name location');
    
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }
    
    res.status(200).json({ success: true, data: expense });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update expense
exports.updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }
    
    res.status(200).json({ success: true, data: expense });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete expense
exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }
    
    res.status(200).json({ success: true, message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
