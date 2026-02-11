const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Employee name is required'],
      trim: true,
      minlength: [1, 'Employee name cannot be empty'],
      maxlength: [100, 'Employee name cannot exceed 100 characters']
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      validate: {
        validator: function(v) {
          return /^\d{10}$/.test(v);
        },
        message: 'Phone number must be exactly 10 digits'
      },
      unique: true
    },
    role: {
      type: String,
      required: [true, 'Employee role is required'],
      trim: true,
      maxlength: [50, 'Role cannot exceed 50 characters']
    },
    salaryType: {
      type: String,
      enum: {
        values: ['daily', 'monthly'],
        message: 'Salary type must be either daily or monthly'
      },
      required: [true, 'Salary type is required']
    },
    salaryAmount: {
      type: Number,
      required: [true, 'Salary amount is required'],
      min: [0, 'Salary amount must be a positive number']
    },
    salaryHistory: [
      {
        amount: {
          type: Number,
          required: true,
          min: [0, 'Salary amount must be positive']
        },
        effectiveDate: {
          type: Date,
          required: true
        },
        reason: {
          type: String,
          trim: true,
          maxlength: [200, 'Reason cannot exceed 200 characters']
        },
        changedBy: {
          type: String,
          trim: true
        },
        changedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    currentSite: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Site',
      default: null
    },
    advancePayments: [
      {
        amount: {
          type: Number,
          required: true,
          min: [0, 'Advance payment amount must be positive']
        },
        date: {
          type: Date,
          required: true,
          default: Date.now
        },
        description: {
          type: String,
          trim: true,
          maxlength: [200, 'Description cannot exceed 200 characters']
        }
      }
    ],
    totalAdvance: {
      type: Number,
      default: 0,
      min: [0, 'Total advance cannot be negative']
    },
    isActive: {
      type: Boolean,
      default: true
    },
    joiningDate: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Create indexes for performance optimization
employeeSchema.index({ phone: 1 });
employeeSchema.index({ currentSite: 1 });
employeeSchema.index({ isActive: 1 });
employeeSchema.index({ name: 1 });

// Virtual field for net salary calculation
// This calculates the net payable amount after deducting advances
employeeSchema.virtual('netSalary').get(function () {
  // For monthly employees, net salary is monthly amount minus total advances
  // For daily employees, this would need to be calculated based on attendance
  // which is done separately in the attendance module
  if (this.salaryType === 'monthly') {
    return Math.max(0, this.salaryAmount - this.totalAdvance);
  }
  // For daily wage employees, return the daily rate
  // Actual net salary calculation happens in attendance/payroll processing
  return this.salaryAmount;
});

// Method to add advance payment
employeeSchema.methods.addAdvancePayment = async function (amount, description = '') {
  if (amount <= 0) {
    throw new Error('Advance payment amount must be positive');
  }

  this.advancePayments.push({
    amount,
    date: new Date(),
    description
  });

  this.totalAdvance += amount;
  await this.save();
  return this;
};

// Method to update salary with history tracking
employeeSchema.methods.updateSalary = async function (newAmount, effectiveDate, reason = '', changedBy = 'Admin') {
  if (newAmount <= 0) {
    throw new Error('Salary amount must be positive');
  }

  // Add current salary to history before updating
  this.salaryHistory.push({
    amount: this.salaryAmount,
    effectiveDate: effectiveDate || new Date(),
    reason,
    changedBy,
    changedAt: new Date()
  });

  this.salaryAmount = newAmount;
  await this.save();
  return this;
};

// Method to get salary summary
employeeSchema.methods.getSalarySummary = function () {
  return {
    employeeId: this._id,
    name: this.name,
    salaryType: this.salaryType,
    salaryAmount: this.salaryAmount,
    totalAdvance: this.totalAdvance,
    netSalary: this.netSalary,
    advancePayments: this.advancePayments
  };
};

// Ensure virtuals are included when converting to JSON
employeeSchema.set('toJSON', { virtuals: true });
employeeSchema.set('toObject', { virtuals: true });

const Employee = mongoose.model('Employee', employeeSchema);

module.exports = Employee;
