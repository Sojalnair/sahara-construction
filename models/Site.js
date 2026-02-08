const mongoose = require('mongoose');

const siteSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Site name is required'],
      unique: true,
      trim: true,
      maxlength: [100, 'Site name cannot exceed 100 characters']
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
      maxlength: [200, 'Location cannot exceed 200 characters']
    },
    coordinates: {
      latitude: {
        type: Number,
        min: -90,
        max: 90
      },
      longitude: {
        type: Number,
        min: -180,
        max: 180
      }
    },
    allowedRadius: {
      type: Number,
      default: 200, // meters - employees must be within this radius to mark attendance
      min: 50,
      max: 1000
    },
    status: {
      type: String,
      enum: ['Active', 'Completed', 'On-Hold'],
      default: 'Active'
    },
    supervisor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required']
    },
    endDate: {
      type: Date
    },
    totalExpenses: {
      type: Number,
      default: 0
    },
    assignedEmployees: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    }]
  },
  {
    timestamps: true
  }
);

siteSchema.index({ name: 1 });
siteSchema.index({ supervisor: 1 });
siteSchema.index({ status: 1 });

const Site = mongoose.model('Site', siteSchema);

module.exports = Site;
