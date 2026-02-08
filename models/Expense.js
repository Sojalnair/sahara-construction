const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    site: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Site',
      required: true
    },
    category: {
      type: String,
      enum: ['Labour', 'Materials', 'Transport', 'Miscellaneous'],
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    date: {
      type: Date,
      required: true,
      default: Date.now
    },
    description: {
      type: String,
      trim: true
    },
    billAttachment: {
      type: String,
      trim: true
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    },
    paymentStatus: {
      type: String,
      enum: ['Paid', 'Pending'],
      default: 'Pending'
    }
  },
  {
    timestamps: true
  }
);

expenseSchema.index({ site: 1 });
expenseSchema.index({ category: 1 });
expenseSchema.index({ date: 1 });
expenseSchema.index({ paymentStatus: 1 });

const Expense = mongoose.model('Expense', expenseSchema);

module.exports = Expense;
