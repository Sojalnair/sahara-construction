import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

// API Base URL
const API_URL = 'https://sahara-construction.onrender.com';

// Axios instance
const api = axios.create({
  baseURL: API_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Login Component
function Login({ onLogin }) {
  const [loginType, setLoginType] = useState('admin'); // 'admin' or 'employee'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [showSetup, setShowSetup] = useState(false);
  const [setupData, setSetupData] = useState({ name: '', email: '', password: '' });

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
      onLogin(response.data.data.user);
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Invalid email or password');
      } else {
        setError(err.response?.data?.message || 'Login failed');
      }
    }
  };

  const handleEmployeeLogin = async (e) => {
    e.preventDefault();
    try {
      // Use the new employee login endpoint
      const response = await api.post('/auth/employee-login', { phone });
      const employee = response.data.data.employee;
      
      // Create employee user object
      const employeeUser = {
        _id: employee._id,
        name: employee.name,
        email: employee.phone + '@employee.local',
        role: 'Employee',
        employeeData: employee
      };
      
      localStorage.setItem('user', JSON.stringify(employeeUser));
      onLogin(employeeUser);
    } catch (err) {
      console.error('Employee login error:', err);
      if (err.response?.status === 401) {
        setError('Employee not found or inactive');
      } else {
        setError(err.response?.data?.message || 'Employee login failed');
      }
    }
  };

  const handleSetup = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/auth/setup', setupData);
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
      onLogin(response.data.data.user);
    } catch (err) {
      setError(err.response?.data?.message || 'Setup failed');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Sahara Construction</h2>
        
        {!showSetup ? (
          <>
            <div className="login-tabs">
              <button 
                className={loginType === 'admin' ? 'active' : ''} 
                onClick={() => { setLoginType('admin'); setError(''); }}
              >
                Admin Login
              </button>
              <button 
                className={loginType === 'employee' ? 'active' : ''} 
                onClick={() => { setLoginType('employee'); setError(''); }}
              >
                Employee Login
              </button>
            </div>

            {loginType === 'admin' ? (
              <form onSubmit={handleAdminLogin}>
                <input
                  type="email"
                  placeholder="Admin Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button type="submit">Login as Admin</button>
                {error && <p className="error">{error}</p>}
                <p className="setup-link">
                  First time? <button type="button" onClick={() => setShowSetup(true)} className="link-btn">Create Admin Account</button>
                </p>
              </form>
            ) : (
              <form onSubmit={handleEmployeeLogin}>
                <input
                  type="tel"
                  placeholder="Phone Number (10 digits)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  pattern="[0-9]{10}"
                  required
                />
                <button type="submit">Login as Employee</button>
                {error && <p className="error">{error}</p>}
                <p className="info-text">Enter your registered phone number</p>
              </form>
            )}
          </>
        ) : (
          <form onSubmit={handleSetup}>
            <h3>Create First Admin User</h3>
            <input
              type="text"
              placeholder="Full Name"
              value={setupData.name}
              onChange={(e) => setSetupData({ ...setupData, name: e.target.value })}
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={setupData.email}
              onChange={(e) => setSetupData({ ...setupData, email: e.target.value })}
              required
            />
            <input
              type="password"
              placeholder="Password (min 6 characters)"
              value={setupData.password}
              onChange={(e) => setSetupData({ ...setupData, password: e.target.value })}
              required
            />
            <button type="submit">Create Admin Account</button>
            {error && <p className="error">{error}</p>}
            <p className="setup-link">
              <button type="button" onClick={() => setShowSetup(false)} className="link-btn">Back to Login</button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

// Dashboard Component
function Dashboard({ user }) {
  const [stats, setStats] = useState({
    employees: 0,
    sites: 0,
    attendance: 0,
    expenses: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [employees, sites, attendance, expenses] = await Promise.all([
          api.get('/employees'),
          api.get('/sites'),
          api.get('/attendance'),
          api.get('/expenses')
        ]);
        setStats({
          employees: employees.data.data?.pagination?.total || 0,
          sites: sites.data.data?.length || 0,
          attendance: attendance.data.data?.length || 0,
          expenses: expenses.data.data?.reduce((sum, exp) => sum + exp.amount, 0) || 0
        });
      } catch (err) {
        console.error('Error fetching stats:', err);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="dashboard">
      <h2>Dashboard</h2>
      <p>Welcome, {user.name} ({user.role})</p>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>{stats.employees}</h3>
          <p>Employees</p>
        </div>
        <div className="stat-card">
          <h3>{stats.sites}</h3>
          <p>Sites</p>
        </div>
        <div className="stat-card">
          <h3>{stats.attendance}</h3>
          <p>Attendance Records</p>
        </div>
        <div className="stat-card">
          <h3>₹{stats.expenses.toLocaleString()}</h3>
          <p>Total Expenses</p>
        </div>
      </div>
    </div>
  );
}

// Employee Dashboard Component (Limited View)
function EmployeeDashboard({ user }) {
  const [myAttendance, setMyAttendance] = useState([]);
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState('');
  const [swipeStatus, setSwipeStatus] = useState('');
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM format
  const [stats, setStats] = useState({
    totalDays: 0,
    presentDays: 0,
    totalHours: 0
  });
  const [monthlyStats, setMonthlyStats] = useState({
    present: 0,
    absent: 0,
    halfDay: 0,
    leave: 0,
    totalDays: 0
  });

  useEffect(() => {
    fetchMyAttendance();
    fetchSites();
  }, [user._id]);

  useEffect(() => {
    calculateMonthlyStats();
  }, [myAttendance, selectedMonth]);

  const calculateMonthlyStats = () => {
    const [year, month] = selectedMonth.split('-');
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0);
    
    const monthRecords = myAttendance.filter(att => {
      const attDate = new Date(att.date);
      return attDate >= monthStart && attDate <= monthEnd;
    });

    const present = monthRecords.filter(att => att.status === 'Present').length;
    const absent = monthRecords.filter(att => att.status === 'Absent').length;
    const halfDay = monthRecords.filter(att => att.status === 'Half-Day').length;
    const leave = monthRecords.filter(att => att.status === 'Leave').length;

    setMonthlyStats({
      present,
      absent,
      halfDay,
      leave,
      totalDays: monthRecords.length
    });
  };

  const fetchMyAttendance = async () => {
    try {
      // Use public endpoint for employee attendance
      const response = await axios.get(`${API_URL}/attendance/employee/${user._id}`);
      const myRecords = response.data.data || [];
      setMyAttendance(myRecords);
      
      // Check if already marked attendance today
      const today = new Date().toISOString().split('T')[0];
      const todayRecord = myRecords.find(att => 
        new Date(att.date).toISOString().split('T')[0] === today
      );
      setTodayAttendance(todayRecord);
      
      // Calculate overall stats
      const presentDays = myRecords.filter(att => att.status === 'Present').length;
      const totalHours = myRecords.reduce((sum, att) => sum + (att.hoursWorked || 0), 0);
      setStats({
        totalDays: myRecords.length,
        presentDays,
        totalHours
      });
    } catch (err) {
      console.error('Error fetching attendance:', err);
    }
  };

  const fetchSites = async () => {
    try {
      // Use public endpoint for active sites
      console.log('Fetching sites from:', `${API_URL}/sites/public/active`);
      const response = await axios.get(`${API_URL}/sites/public/active`);
      console.log('Sites response:', response.data);
      setSites(response.data.data || []);
      console.log('Sites set to:', response.data.data);
    } catch (err) {
      console.error('Error fetching sites:', err);
    }
  };

  const handleClockIn = async () => {
    if (!selectedSite) {
      setSwipeStatus('Please select a site first');
      return;
    }

    if (todayAttendance) {
      setSwipeStatus('Already clocked in for today');
      return;
    }

    setSwipeStatus('Getting your location...');

    // Request location permission
    if (!navigator.geolocation) {
      setSwipeStatus('Location services not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          setSwipeStatus('Clocking in...');
          const { latitude, longitude } = position.coords;

          // Use public endpoint for marking attendance with location
          await axios.post(`${API_URL}/attendance/employee/mark`, {
            employee: user._id,
            site: selectedSite,
            date: new Date().toISOString().split('T')[0],
            latitude,
            longitude,
            clockIn: new Date().toISOString()
          });
          
          setSwipeStatus('✓ Clocked in successfully!');
          setTimeout(() => setSwipeStatus(''), 3000);
          fetchMyAttendance();
        } catch (err) {
          const errorMsg = err.response?.data?.message || 'Failed to clock in. Please try again.';
          setSwipeStatus(errorMsg);
          console.error('Error clocking in:', err);
        }
      },
      (error) => {
        console.error('Location error:', error);
        let errorMsg = 'Location access denied. ';
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMsg += 'Please enable location services to clock in.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg += 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMsg += 'Location request timed out.';
            break;
          default:
            errorMsg += 'Unknown error occurred.';
        }
        
        setSwipeStatus(errorMsg);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleClockOut = async () => {
    if (!todayAttendance) {
      setSwipeStatus('No clock-in record found for today');
      return;
    }

    if (todayAttendance.clockOut) {
      setSwipeStatus('Already clocked out for today');
      return;
    }

    setSwipeStatus('Getting your location...');

    if (!navigator.geolocation) {
      setSwipeStatus('Location services not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          setSwipeStatus('Clocking out...');
          const { latitude, longitude } = position.coords;

          await axios.put(`${API_URL}/attendance/employee/clock-out/${todayAttendance._id}`, {
            latitude,
            longitude,
            clockOut: new Date().toISOString()
          });
          
          setSwipeStatus('✓ Clocked out successfully!');
          setTimeout(() => setSwipeStatus(''), 3000);
          fetchMyAttendance();
        } catch (err) {
          const errorMsg = err.response?.data?.message || 'Failed to clock out. Please try again.';
          setSwipeStatus(errorMsg);
          console.error('Error clocking out:', err);
        }
      },
      (error) => {
        console.error('Location error:', error);
        setSwipeStatus('Location access denied. Please enable location services.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  return (
    <div className="dashboard">
      <h2>My Dashboard</h2>
      <p>Welcome, {user.name}</p>
      <p className="employee-info">Role: {user.employeeData?.role} | Phone: {user.employeeData?.phone}</p>
      
      {/* Clock In/Out Section */}
      <div className="swipe-attendance-card">
        <h3>Clock In / Clock Out</h3>
        {todayAttendance ? (
          <div className="attendance-marked">
            <div className="check-icon">✓</div>
            <p>Attendance Recorded for Today</p>
            <div className="time-details">
              <div className="time-item">
                <span className="time-label">Clock In:</span>
                <span className="time-value">{todayAttendance.clockIn ? new Date(todayAttendance.clockIn).toLocaleTimeString() : 'N/A'}</span>
              </div>
              <div className="time-item">
                <span className="time-label">Clock Out:</span>
                <span className="time-value">{todayAttendance.clockOut ? new Date(todayAttendance.clockOut).toLocaleTimeString() : 'Not clocked out yet'}</span>
              </div>
              <div className="time-item">
                <span className="time-label">Site:</span>
                <span className="time-value">{todayAttendance.site?.name}</span>
              </div>
            </div>
            {!todayAttendance.clockOut && (
              <button onClick={handleClockOut} className="swipe-btn clock-out-btn">
                <span className="swipe-icon">🕐</span>
                Clock Out
              </button>
            )}
          </div>
        ) : (
          <div className="swipe-form">
            <select 
              value={selectedSite} 
              onChange={(e) => setSelectedSite(e.target.value)}
              className="site-select"
            >
              <option value="">Select Your Site</option>
              {sites.length === 0 && <option value="" disabled>No active sites available</option>}
              {sites.map((site) => (
                <option key={site._id} value={site._id}>{site.name} - {site.location}</option>
              ))}
            </select>
            {sites.length === 0 && (
              <p className="info-message">No active sites found. Please contact admin to create sites.</p>
            )}
            <button 
              onClick={handleClockIn} 
              className="swipe-btn"
              disabled={!selectedSite}
            >
              <span className="swipe-icon">🕐</span>
              Clock In
            </button>
            {swipeStatus && <p className="swipe-status">{swipeStatus}</p>}
          </div>
        )}
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>{stats.totalDays}</h3>
          <p>Total Days</p>
        </div>
        <div className="stat-card">
          <h3>{stats.presentDays}</h3>
          <p>Present Days</p>
        </div>
        <div className="stat-card">
          <h3>{stats.totalHours}</h3>
          <p>Total Hours</p>
        </div>
        <div className="stat-card">
          <h3>₹{user.employeeData?.salaryAmount || 0}</h3>
          <p>Salary ({user.employeeData?.salaryType})</p>
        </div>
      </div>

      {/* Monthly Attendance Summary */}
      <div className="monthly-summary">
        <div className="monthly-header">
          <h3>Monthly Attendance Summary</h3>
          <input 
            type="month" 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            max={new Date().toISOString().slice(0, 7)}
            className="month-picker"
          />
        </div>
        <div className="monthly-stats-grid">
          <div className="monthly-stat-card present-card">
            <div className="stat-icon">✓</div>
            <h4>{monthlyStats.present}</h4>
            <p>Present</p>
          </div>
          <div className="monthly-stat-card absent-card">
            <div className="stat-icon">✗</div>
            <h4>{monthlyStats.absent}</h4>
            <p>Absent</p>
          </div>
          <div className="monthly-stat-card halfday-card">
            <div className="stat-icon">◐</div>
            <h4>{monthlyStats.halfDay}</h4>
            <p>Half-Day</p>
          </div>
          <div className="monthly-stat-card leave-card">
            <div className="stat-icon">🏖</div>
            <h4>{monthlyStats.leave}</h4>
            <p>Leave</p>
          </div>
        </div>
        <div className="monthly-total">
          <strong>Total Working Days:</strong> {monthlyStats.totalDays}
        </div>
      </div>

      <div className="my-attendance">
        <h3>My Attendance History</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Site</th>
              <th>Status</th>
              <th>Hours Worked</th>
            </tr>
          </thead>
          <tbody>
            {myAttendance.length > 0 ? (
              myAttendance.map((att) => (
                <tr key={att._id}>
                  <td>{new Date(att.date).toLocaleDateString()}</td>
                  <td>{att.site?.name || 'N/A'}</td>
                  <td><span className={`status ${att.status.toLowerCase()}`}>{att.status}</span></td>
                  <td>{att.hoursWorked || '-'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center' }}>No attendance records found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Employees Component
function Employees() {
  const [employees, setEmployees] = useState([]);
  const [employeeStats, setEmployeeStats] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    role: '',
    salaryType: 'daily',
    salaryAmount: ''
  });

  useEffect(() => {
    fetchEmployees();
    fetchEmployeeStats();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/employees');
      // Backend returns { success, data: { employees, pagination } }
      setEmployees(response.data.data?.employees || []);
    } catch (err) {
      console.error('Error fetching employees:', err);
      setEmployees([]);
    }
  };

  const fetchEmployeeStats = async () => {
    try {
      const response = await api.get('/attendance');
      const allAttendance = response.data.data || [];
      
      // Calculate stats for each employee
      const stats = {};
      allAttendance.forEach(att => {
        const empId = att.employee?._id;
        if (empId) {
          if (!stats[empId]) {
            stats[empId] = { totalDays: 0, presentDays: 0, totalHours: 0 };
          }
          stats[empId].totalDays++;
          if (att.status === 'Present') {
            stats[empId].presentDays++;
          }
          stats[empId].totalHours += att.hoursWorked || 0;
        }
      });
      
      setEmployeeStats(stats);
    } catch (err) {
      console.error('Error fetching employee stats:', err);
    }
  };

  const calculatePayment = (emp, stats) => {
    const { presentDays = 0 } = stats;
    const salaryAmount = emp.salaryAmount || 0;
    const totalAdvance = emp.totalAdvance || 0;
    
    let totalEarned = 0;
    if (emp.salaryType === 'daily') {
      totalEarned = presentDays * salaryAmount;
    } else {
      // For monthly, assume full month salary
      totalEarned = salaryAmount;
    }
    
    const pending = totalEarned - totalAdvance;
    
    return {
      totalEarned,
      totalPaid: totalAdvance,
      pending: Math.max(0, pending),
      overpaid: pending < 0 ? Math.abs(pending) : 0
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/employees', formData);
      setShowForm(false);
      setFormData({ name: '', phone: '', role: '', salaryType: 'daily', salaryAmount: '' });
      fetchEmployees();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating employee');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure?')) {
      try {
        await api.delete(`/employees/${id}`);
        fetchEmployees();
      } catch (err) {
        alert('Error deleting employee');
      }
    }
  };

  return (
    <div className="employees">
      <div className="header">
        <h2>Employees</h2>
        <button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Add Employee'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="form">
          <input
            placeholder="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <input
            placeholder="Phone (10 digits)"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
          />
          <input
            placeholder="Role"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            required
          />
          <select
            value={formData.salaryType}
            onChange={(e) => setFormData({ ...formData, salaryType: e.target.value })}
          >
            <option value="daily">Daily</option>
            <option value="monthly">Monthly</option>
          </select>
          <input
            type="number"
            placeholder="Salary Amount"
            value={formData.salaryAmount}
            onChange={(e) => setFormData({ ...formData, salaryAmount: e.target.value })}
            required
          />
          <button type="submit">Create Employee</button>
        </form>
      )}

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Phone</th>
            <th>Role</th>
            <th>Salary</th>
            <th>Days Worked</th>
            <th>Total Earned</th>
            <th>Paid</th>
            <th>Pending</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => {
            const stats = employeeStats[emp._id] || { totalDays: 0, presentDays: 0, totalHours: 0 };
            const payment = calculatePayment(emp, stats);
            return (
              <tr key={emp._id}>
                <td><strong>{emp.name}</strong></td>
                <td>{emp.phone}</td>
                <td>{emp.role}</td>
                <td>
                  <div>₹{emp.salaryAmount}</div>
                  <small style={{color: '#999'}}>({emp.salaryType})</small>
                </td>
                <td>
                  <span className="stats-badge">{stats.presentDays} days</span>
                </td>
                <td>
                  <span className="money-badge earned">₹{payment.totalEarned.toLocaleString()}</span>
                </td>
                <td>
                  <span className="money-badge paid">₹{payment.totalPaid.toLocaleString()}</span>
                </td>
                <td>
                  {payment.overpaid > 0 ? (
                    <span className="money-badge overpaid">-₹{payment.overpaid.toLocaleString()}</span>
                  ) : (
                    <span className="money-badge pending">₹{payment.pending.toLocaleString()}</span>
                  )}
                </td>
                <td>
                  <span className={`status-badge ${emp.isActive ? 'active' : 'inactive'}`}>
                    {emp.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <button onClick={() => handleDelete(emp._id)} className="delete-btn">
                    Delete
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Sites Component
function Sites() {
  const [sites, setSites] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    startDate: '',
    status: 'Active',
    latitude: '',
    longitude: '',
    allowedRadius: 200
  });

  useEffect(() => {
    fetchSites();
  }, []);

  const fetchSites = async () => {
    try {
      const response = await api.get('/sites');
      setSites(response.data.data || []);
    } catch (err) {
      console.error('Error fetching sites:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        coordinates: formData.latitude && formData.longitude ? {
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude)
        } : undefined
      };
      await api.post('/sites', payload);
      setShowForm(false);
      setFormData({ name: '', location: '', startDate: '', status: 'Active', latitude: '', longitude: '', allowedRadius: 200 });
      fetchSites();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating site');
    }
  };

  return (
    <div className="sites">
      <div className="header">
        <h2>Sites</h2>
        <button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Add Site'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="form">
          <input
            placeholder="Site Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <input
            placeholder="Location Address"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            required
          />
          <input
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            required
          />
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          >
            <option value="Active">Active</option>
            <option value="On-Hold">On-Hold</option>
            <option value="Completed">Completed</option>
          </select>
          <input
            type="number"
            step="any"
            placeholder="GPS Latitude (optional)"
            value={formData.latitude}
            onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
          />
          <input
            type="number"
            step="any"
            placeholder="GPS Longitude (optional)"
            value={formData.longitude}
            onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
          />
          <input
            type="number"
            placeholder="Allowed Radius (meters)"
            value={formData.allowedRadius}
            onChange={(e) => setFormData({ ...formData, allowedRadius: e.target.value })}
            min="50"
            max="1000"
          />
          <button type="submit" style={{gridColumn: 'span 2'}}>Create Site</button>
        </form>
      )}

      <div className="sites-grid">
        {sites.map((site) => (
          <div key={site._id} className="site-card">
            <h3>{site.name}</h3>
            <p><strong>Location:</strong> {site.location}</p>
            <p><strong>Status:</strong> <span className={`status ${site.status.toLowerCase()}`}>{site.status}</span></p>
            <p><strong>Start Date:</strong> {new Date(site.startDate).toLocaleDateString()}</p>
            {site.coordinates && site.coordinates.latitude && (
              <p><strong>GPS:</strong> {site.coordinates.latitude.toFixed(6)}, {site.coordinates.longitude.toFixed(6)}</p>
            )}
            {site.allowedRadius && (
              <p><strong>Radius:</strong> {site.allowedRadius}m</p>
            )}
            <p><strong>Expenses:</strong> ₹{site.totalExpenses?.toLocaleString() || 0}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Attendance Component
function Attendance() {
  const [attendance, setAttendance] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [sites, setSites] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedEmployee, setSelectedEmployee] = useState(''); // Filter by employee
  const [formData, setFormData] = useState({
    employee: '',
    site: '',
    date: new Date().toISOString().split('T')[0],
    status: 'Present',
    hoursWorked: 8,
    clockIn: '',
    clockOut: ''
  });

  useEffect(() => {
    fetchAttendance();
    fetchEmployees();
    fetchSites();
  }, []);

  const fetchAttendance = async () => {
    try {
      const response = await api.get('/attendance');
      setAttendance(response.data.data || []);
    } catch (err) {
      console.error('Error fetching attendance:', err);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/employees');
      setEmployees(response.data.data?.employees || []);
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

  const fetchSites = async () => {
    try {
      const response = await api.get('/sites');
      setSites(response.data.data || []);
    } catch (err) {
      console.error('Error fetching sites:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      if (formData.clockIn) {
        payload.clockIn = new Date(`${formData.date}T${formData.clockIn}`).toISOString();
      }
      if (formData.clockOut) {
        payload.clockOut = new Date(`${formData.date}T${formData.clockOut}`).toISOString();
      }
      await api.post('/attendance', payload);
      setShowForm(false);
      setFormData({ employee: '', site: '', date: new Date().toISOString().split('T')[0], status: 'Present', hoursWorked: 8, clockIn: '', clockOut: '' });
      fetchAttendance();
    } catch (err) {
      alert(err.response?.data?.message || 'Error marking attendance');
    }
  };

  const generateCalendar = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const calendar = [];
    const weeks = [];
    let week = new Array(7).fill(null);
    
    // Fill in the days
    for (let day = 1; day <= daysInMonth; day++) {
      const dayOfWeek = (startingDayOfWeek + day - 1) % 7;
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      // Count attendance for this day
      let dayAttendance = attendance.filter(att => 
        new Date(att.date).toISOString().split('T')[0] === dateStr
      );
      
      // Filter by selected employee if one is selected
      if (selectedEmployee) {
        dayAttendance = dayAttendance.filter(att => att.employee?._id === selectedEmployee);
      }
      
      const presentCount = dayAttendance.filter(att => att.status === 'Present').length;
      
      // If filtering by employee, total is 1, otherwise all employees
      const totalEmployees = selectedEmployee ? 1 : employees.length;
      const absentCount = selectedEmployee 
        ? (dayAttendance.length === 0 ? 1 : 0) // If no record, employee is absent
        : totalEmployees - presentCount;
      
      week[dayOfWeek] = {
        day,
        dateStr,
        presentCount,
        absentCount,
        totalEmployees,
        isPast: new Date(dateStr) < new Date(new Date().toISOString().split('T')[0])
      };
      
      if (dayOfWeek === 6) {
        weeks.push([...week]);
        week = new Array(7).fill(null);
      }
    }
    
    if (week.some(d => d !== null)) {
      weeks.push(week);
    }
    
    return weeks;
  };

  const calendarWeeks = generateCalendar();

  return (
    <div className="attendance">
      <div className="header">
        <h2>Attendance</h2>
        <button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Mark Attendance'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="form">
          <select
            value={formData.employee}
            onChange={(e) => setFormData({ ...formData, employee: e.target.value })}
            required
          >
            <option value="">Select Employee</option>
            {employees.map((emp) => (
              <option key={emp._id} value={emp._id}>{emp.name} - {emp.role}</option>
            ))}
          </select>
          <select
            value={formData.site}
            onChange={(e) => setFormData({ ...formData, site: e.target.value })}
            required
          >
            <option value="">Select Site</option>
            {sites.map((site) => (
              <option key={site._id} value={site._id}>{site.name}</option>
            ))}
          </select>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          >
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
            <option value="Half-Day">Half-Day</option>
            <option value="Leave">Leave</option>
          </select>
          <input
            type="time"
            placeholder="Clock In Time"
            value={formData.clockIn}
            onChange={(e) => setFormData({ ...formData, clockIn: e.target.value })}
          />
          <input
            type="time"
            placeholder="Clock Out Time"
            value={formData.clockOut}
            onChange={(e) => setFormData({ ...formData, clockOut: e.target.value })}
          />
          <input
            type="number"
            placeholder="Hours Worked"
            value={formData.hoursWorked}
            onChange={(e) => setFormData({ ...formData, hoursWorked: e.target.value })}
            min="0"
            max="24"
            step="0.5"
          />
          <button type="submit" style={{gridColumn: 'span 2'}}>Mark Attendance</button>
        </form>
      )}

      {/* Calendar View */}
      <div className="calendar-container">
        <div className="calendar-header">
          <h3>Attendance Calendar</h3>
          <div className="calendar-filters">
            <select 
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="employee-filter"
            >
              <option value="">All Employees</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>{emp.name}</option>
              ))}
            </select>
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="month-picker"
            >
              <option value="2025-01">January 2025</option>
              <option value="2025-02">February 2025</option>
              <option value="2025-03">March 2025</option>
              <option value="2025-04">April 2025</option>
              <option value="2025-05">May 2025</option>
              <option value="2025-06">June 2025</option>
              <option value="2025-07">July 2025</option>
              <option value="2025-08">August 2025</option>
              <option value="2025-09">September 2025</option>
              <option value="2025-10">October 2025</option>
              <option value="2025-11">November 2025</option>
              <option value="2025-12">December 2025</option>
            </select>
          </div>
        </div>
        <div className="calendar">
          <div className="calendar-weekdays">
            <div className="weekday">Sun</div>
            <div className="weekday">Mon</div>
            <div className="weekday">Tue</div>
            <div className="weekday">Wed</div>
            <div className="weekday">Thu</div>
            <div className="weekday">Fri</div>
            <div className="weekday">Sat</div>
          </div>
          <div className="calendar-days">
            {calendarWeeks.map((week, weekIdx) => (
              <div key={weekIdx} className="calendar-week">
                {week.map((day, dayIdx) => (
                  <div 
                    key={dayIdx} 
                    className={`calendar-day ${!day ? 'empty' : ''} ${day && !day.isPast ? 'future' : ''} ${day && day.presentCount > 0 ? 'has-present' : ''} ${day && day.absentCount > 0 && day.presentCount === 0 ? 'has-absent' : ''}`}
                  >
                    {day && (
                      <>
                        <div className="day-number">{day.day}</div>
                        <div className="day-stats">
                          {day.presentCount > 0 ? (
                            <div className="present-count" title="Present">
                              ✓ {day.presentCount}
                            </div>
                          ) : day.absentCount > 0 ? (
                            <div className="absent-count" title="Absent">
                              ✗ {day.absentCount}
                            </div>
                          ) : null}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Employee</th>
            <th>Site</th>
            <th>Clock In</th>
            <th>Clock Out</th>
            <th>Status</th>
            <th>Hours</th>
            <th>GPS Location</th>
          </tr>
        </thead>
        <tbody>
          {attendance.map((att) => (
            <tr key={att._id}>
              <td>{new Date(att.date).toLocaleDateString()}</td>
              <td>{att.employee?.name || 'N/A'}</td>
              <td>{att.site?.name || 'N/A'}</td>
              <td>{att.clockIn ? new Date(att.clockIn).toLocaleTimeString() : '-'}</td>
              <td>{att.clockOut ? new Date(att.clockOut).toLocaleTimeString() : '-'}</td>
              <td><span className={`status ${att.status.toLowerCase()}`}>{att.status}</span></td>
              <td>{att.hoursWorked || '-'}</td>
              <td>
                {att.markedFrom && att.markedFrom.latitude ? (
                  <a 
                    href={`https://www.google.com/maps?q=${att.markedFrom.latitude},${att.markedFrom.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="gps-link"
                  >
                    📍 View Map
                    {att.markedFrom.distance && ` (${att.markedFrom.distance}m)`}
                  </a>
                ) : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Expenses Component
function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [sites, setSites] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [formData, setFormData] = useState({
    site: '',
    category: 'Labour',
    amount: '',
    description: '',
    billAttachment: null,
    employee: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchExpenses();
    fetchSites();
    fetchEmployees();
  }, []);

  const fetchExpenses = async () => {
    try {
      const response = await api.get('/expenses');
      setExpenses(response.data.data || []);
    } catch (err) {
      console.error('Error fetching expenses:', err);
    }
  };

  const fetchSites = async () => {
    try {
      const response = await api.get('/sites');
      setSites(response.data.data || []);
    } catch (err) {
      console.error('Error fetching sites:', err);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/employees');
      setEmployees(response.data.data?.employees || []);
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = { 
        site: formData.site,
        category: formData.category,
        amount: formData.amount,
        description: formData.description,
        employee: formData.employee,
        date: formData.date
      };
      
      // Skip file upload for now - can be added later with proper Cloudinary setup
      // Just save the expense without the attachment
      
      await api.post('/expenses', submitData);
      setShowForm(false);
      setFormData({ site: '', category: 'Labour', amount: '', description: '', billAttachment: null, employee: '', date: new Date().toISOString().split('T')[0] });
      fetchExpenses();
    } catch (err) {
      console.error('Error creating expense:', err);
      alert(err.response?.data?.message || 'Error creating expense');
    }
  };

  // Filter expenses by selected month
  const filteredExpenses = selectedMonth === 'all' 
    ? expenses 
    : expenses.filter(e => {
        const expenseMonth = new Date(e.date).toISOString().slice(0, 7);
        return expenseMonth === selectedMonth;
      });

  // Calculate expense stats by category
  const expenseStats = {
    labour: filteredExpenses.filter(e => e.category === 'Labour').reduce((sum, e) => sum + e.amount, 0),
    materials: filteredExpenses.filter(e => e.category === 'Materials').reduce((sum, e) => sum + e.amount, 0),
    transport: filteredExpenses.filter(e => e.category === 'Transport').reduce((sum, e) => sum + e.amount, 0),
    miscellaneous: filteredExpenses.filter(e => e.category === 'Miscellaneous').reduce((sum, e) => sum + e.amount, 0),
    total: filteredExpenses.reduce((sum, e) => sum + e.amount, 0)
  };

  return (
    <div className="expenses">
      <div className="header">
        <h2>Expenses</h2>
        <div className="header-actions">
          <select 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="month-filter"
          >
            <option value="all">All Time</option>
            <option value="2025-01">January 2025</option>
            <option value="2025-02">February 2025</option>
            <option value="2025-03">March 2025</option>
            <option value="2025-04">April 2025</option>
            <option value="2025-05">May 2025</option>
            <option value="2025-06">June 2025</option>
            <option value="2025-07">July 2025</option>
            <option value="2025-08">August 2025</option>
            <option value="2025-09">September 2025</option>
            <option value="2025-10">October 2025</option>
            <option value="2025-11">November 2025</option>
            <option value="2025-12">December 2025</option>
          </select>
          <button onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'Add Expense'}
          </button>
        </div>
      </div>

      {/* Expense Statistics */}
      <div className="expense-stats">
        <div className="expense-stat-card labour-expense">
          <div className="expense-icon">👷</div>
          <h4>₹{expenseStats.labour.toLocaleString()}</h4>
          <p>Labour</p>
        </div>
        <div className="expense-stat-card materials-expense">
          <div className="expense-icon">🧱</div>
          <h4>₹{expenseStats.materials.toLocaleString()}</h4>
          <p>Materials</p>
        </div>
        <div className="expense-stat-card transport-expense">
          <div className="expense-icon">🚚</div>
          <h4>₹{expenseStats.transport.toLocaleString()}</h4>
          <p>Transport</p>
        </div>
        <div className="expense-stat-card misc-expense">
          <div className="expense-icon">📦</div>
          <h4>₹{expenseStats.miscellaneous.toLocaleString()}</h4>
          <p>Miscellaneous</p>
        </div>
        <div className="expense-stat-card total-expense">
          <div className="expense-icon">💰</div>
          <h4>₹{expenseStats.total.toLocaleString()}</h4>
          <p>Total Expenses</p>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="form">
          <select
            value={formData.site}
            onChange={(e) => setFormData({ ...formData, site: e.target.value })}
            required
          >
            <option value="">Select Site</option>
            {sites.map((site) => (
              <option key={site._id} value={site._id}>{site.name}</option>
            ))}
          </select>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value, employee: '' })}
          >
            <option value="Labour">Labour</option>
            <option value="Materials">Materials</option>
            <option value="Transport">Transport</option>
            <option value="Miscellaneous">Miscellaneous</option>
          </select>
          {formData.category === 'Labour' && (
            <select
              value={formData.employee}
              onChange={(e) => setFormData({ ...formData, employee: e.target.value })}
              required
            >
              <option value="">Select Employee</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>{emp.name} - {emp.role}</option>
              ))}
            </select>
          )}
          <input
            type="number"
            placeholder="Amount"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            required
          />
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
          <input
            placeholder="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <button type="submit" style={{gridColumn: 'span 2'}}>Create Expense</button>
        </form>
      )}

      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Site</th>
            <th>Category</th>
            <th>Employee</th>
            <th>Amount</th>
            <th>Description</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {filteredExpenses.map((exp) => (
            <tr key={exp._id}>
              <td>{new Date(exp.date).toLocaleDateString()}</td>
              <td>{exp.site?.name || 'N/A'}</td>
              <td>{exp.category}</td>
              <td>{exp.employee ? `${exp.employee.name} (${exp.employee.role})` : '-'}</td>
              <td>₹{exp.amount.toLocaleString()}</td>
              <td>{exp.description || '-'}</td>
              <td>{exp.paymentStatus}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Main App Component
function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // Employee view - limited access
  if (user.role === 'Employee') {
    return (
      <Router>
        <div className="app">
          <nav className="navbar">
            <h1>Sahara Construction</h1>
            <div className="nav-links">
              <Link to="/">My Dashboard</Link>
              <button onClick={handleLogout} className="logout-btn">Logout</button>
            </div>
          </nav>

          <div className="content">
            <Routes>
              <Route path="/" element={<EmployeeDashboard user={user} />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </div>
      </Router>
    );
  }

  // Admin view - full access
  return (
    <Router>
      <div className="app">
        <nav className="navbar">
          <h1>Sahara Construction</h1>
          <div className="nav-links">
            <Link to="/">Dashboard</Link>
            <Link to="/employees">Employees</Link>
            <Link to="/sites">Sites</Link>
            <Link to="/attendance">Attendance</Link>
            <Link to="/expenses">Expenses</Link>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </div>
        </nav>

        <div className="content">
          <Routes>
            <Route path="/" element={<Dashboard user={user} />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/sites" element={<Sites />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
