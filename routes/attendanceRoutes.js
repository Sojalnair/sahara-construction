const express = require('express');
const {
  markAttendance,
  getAttendance,
  updateAttendance,
  deleteAttendance
} = require('../controllers/attendanceController');
const { authenticate, checkRole } = require('../middleware/auth');

const router = express.Router();

// Public route for employees to mark their own attendance
router.post('/employee/mark', async (req, res) => {
  try {
    const Attendance = require('../models/Attendance');
    const Site = require('../models/Site');
    const { employee, site, date, latitude, longitude, clockIn } = req.body;

    // Validate required fields
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Location access is required to mark attendance'
      });
    }

    // Get site details with coordinates
    const siteDetails = await Site.findById(site);
    if (!siteDetails) {
      return res.status(404).json({
        success: false,
        message: 'Site not found'
      });
    }

    // Check if attendance already exists for this employee on this date
    const existingAttendance = await Attendance.findOne({
      employee,
      date: new Date(date)
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already marked for this date'
      });
    }

    // Check if site has coordinates configured
    if (siteDetails.coordinates && siteDetails.coordinates.latitude && siteDetails.coordinates.longitude) {
      // Only verify location if site has coordinates
      const distance = calculateDistance(
        latitude,
        longitude,
        siteDetails.coordinates.latitude,
        siteDetails.coordinates.longitude
      );

      const allowedRadius = siteDetails.allowedRadius || 200;
      if (distance > allowedRadius) {
        return res.status(403).json({
          success: false,
          message: `You must be within ${allowedRadius}m of the site to clock in. Current distance: ${Math.round(distance)}m`
        });
      }

      // Create attendance with distance tracking
      const attendance = await Attendance.create({
        employee,
        site,
        date,
        status: 'Present',
        clockIn: clockIn || new Date(),
        markedFrom: {
          latitude,
          longitude,
          distance: Math.round(distance)
        }
      });

      const populatedAttendance = await Attendance.findById(attendance._id)
        .populate('employee', 'name phone role')
        .populate('site', 'name location');

      return res.status(201).json({
        success: true,
        message: 'Clocked in successfully',
        data: populatedAttendance
      });
    }

    // Site doesn't have coordinates - allow clock in without location verification
    const attendance = await Attendance.create({
      employee,
      site,
      date,
      status: 'Present',
      clockIn: clockIn || new Date(),
      markedFrom: {
        latitude,
        longitude,
        distance: null
      }
    });

    const populatedAttendance = await Attendance.findById(attendance._id)
      .populate('employee', 'name phone role')
      .populate('site', 'name location');

    res.status(201).json({
      success: true,
      message: 'Clocked in successfully (location verification disabled for this site)',
      data: populatedAttendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error marking attendance',
      error: error.message
    });
  }
});

// Helper function to calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

// Public route for employees to view their own attendance
router.get('/employee/:employeeId', async (req, res) => {
  try {
    const Attendance = require('../models/Attendance');
    const { employeeId } = req.params;

    const attendance = await Attendance.find({ employee: employeeId })
      .populate('site', 'name location')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      data: attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance',
      error: error.message
    });
  }
});

// Public route for employees to clock out
router.put('/employee/clock-out/:attendanceId', async (req, res) => {
  try {
    const Attendance = require('../models/Attendance');
    const Site = require('../models/Site');
    const { attendanceId } = req.params;
    const { latitude, longitude, clockOut } = req.body;

    const attendance = await Attendance.findById(attendanceId);
    
    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    if (attendance.clockOut) {
      return res.status(400).json({
        success: false,
        message: 'Already clocked out'
      });
    }

    // Verify location if site has coordinates
    const site = await Site.findById(attendance.site);
    if (site && site.coordinates && site.coordinates.latitude && site.coordinates.longitude) {
      const distance = calculateDistance(
        latitude,
        longitude,
        site.coordinates.latitude,
        site.coordinates.longitude
      );

      const allowedRadius = site.allowedRadius || 200;
      if (distance > allowedRadius) {
        return res.status(403).json({
          success: false,
          message: `You must be within ${allowedRadius}m of the site to clock out. Current distance: ${Math.round(distance)}m`
        });
      }
    }

    // Calculate hours worked
    const clockInTime = new Date(attendance.clockIn);
    const clockOutTime = new Date(clockOut);
    const hoursWorked = Math.round((clockOutTime - clockInTime) / (1000 * 60 * 60) * 10) / 10; // Round to 1 decimal

    attendance.clockOut = clockOut;
    attendance.hoursWorked = hoursWorked;
    await attendance.save();

    const populatedAttendance = await Attendance.findById(attendance._id)
      .populate('employee', 'name phone role')
      .populate('site', 'name location');

    res.status(200).json({
      success: true,
      message: 'Clocked out successfully',
      data: populatedAttendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error clocking out',
      error: error.message
    });
  }
});

router.post('/', authenticate, checkRole('Admin', 'Supervisor'), markAttendance);
router.get('/', authenticate, getAttendance);
router.put('/:id', authenticate, checkRole('Admin', 'Supervisor'), updateAttendance);
router.delete('/:id', authenticate, checkRole('Admin'), deleteAttendance);

module.exports = router;
