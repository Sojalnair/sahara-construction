const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Material name is required'],
      trim: true
    },
    site: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Site',
      required: true
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 0
    },
    unit: {
      type: String,
      required: true
    },
    costPerUnit: {
      type: Number,
      required: true,
      min: 0
    },
    supplier: {
      type: String,
      trim: true
    },
    isStockLow: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

materialSchema.index({ site: 1 });
materialSchema.index({ category: 1 });
materialSchema.index({ isStockLow: 1 });

const Material = mongoose.model('Material', materialSchema);

module.exports = Material;
