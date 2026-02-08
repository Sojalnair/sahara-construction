const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true
    },
    site: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Site',
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['Present', 'Absent', 'Half-Day', 'Leave'],
      required: true
    },
    hoursWorked: {
      type: Number,
      min: 0,
      max: 24,
      default: 8
    },
    clockIn: {
      type: Date
    },
    clockOut: {
      type: Date
    },
    markedFrom: {
      latitude: Number,
      longitude: Number,
      distance: Number, // distance from site in meters
      timestamp: {
        type: Date,
        default: Date.now
      }
    },
    wageEarned: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

attendanceSchema.index({ employee: 1, date: 1, site: 1 }, { unique: true });
attendanceSchema.index({ site: 1, date: 1 });
attendanceSchema.index({ date: 1 });

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;
