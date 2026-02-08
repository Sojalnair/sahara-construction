const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');

// Mark attendance
exports.markAttendance = async (req, res) => {
  try {
    const { employee, site, date, status } = req.body;

    const emp = await Employee.findById(employee);
    if (!emp) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    let wageEarned = 0;
    if (emp.salaryType === 'daily') {
      if (status === 'Present') wageEarned = emp.salaryAmount;
      else if (status === 'Half-day') wageEarned = emp.salaryAmount * 0.5;
    }

    const attendance = await Attendance.create({
      employee,
      site,
      date,
      status,
      wageEarned
    });

    res.status(201).json({ success: true, data: attendance });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get attendance records
exports.getAttendance = async (req, res) => {
  try {
    const { site, employee, startDate, endDate } = req.query;
    const filter = {};
    
    if (site) filter.site = site;
    if (employee) filter.employee = employee;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const attendance = await Attendance.find(filter)
      .populate('employee', 'name phone role')
      .populate('site', 'name location')
      .sort({ date: -1 });

    res.status(200).json({ success: true, count: attendance.length, data: attendance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update attendance
exports.updateAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!attendance) {
      return res.status(404).json({ success: false, message: 'Attendance record not found' });
    }

    res.status(200).json({ success: true, data: attendance });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete attendance
exports.deleteAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findByIdAndDelete(req.params.id);

    if (!attendance) {
      return res.status(404).json({ success: false, message: 'Attendance record not found' });
    }

    res.status(200).json({ success: true, message: 'Attendance deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
