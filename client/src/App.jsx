import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

// Date formatting utility for DD/MM/YYYY format
const formatDateDDMMYYYY = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

// API Base URL - Update this with your actual Render backend URL
const API_URL = import.meta.env.VITE_API_URL || 'https://sahara-construction.onrender.com/api';

// Global refresh event system
const refreshEvents = {
  listeners: new Set(),
  emit: (eventType) => {
    refreshEvents.listeners.forEach(listener => {
      if (listener.eventType === eventType || listener.eventType === 'all') {
        listener.callback();
      }
    });
  },
  subscribe: (eventType, callback) => {
    const listener = { eventType, callback };
    refreshEvents.listeners.add(listener);
    return () => refreshEvents.listeners.delete(listener);
  }
};

// Axios instance
const api = axios.create({
  baseURL: API_URL,
  // Disable caching to ensure fresh data
  headers: {
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Add timestamp to prevent caching
  if (config.url && !config.url.includes('_t=')) {
    const separator = config.url.includes('?') ? '&' : '?';
    config.url += `${separator}_t=${new Date().getTime()}`;
  }
  return config;
});

// Fix date picker issues globally
const fixDatePickers = () => {
  // Add event listeners to all date inputs
  const dateInputs = document.querySelectorAll('input[type="date"]');
  dateInputs.forEach(input => {
    // Ensure proper styling
    input.style.position = 'relative';
    input.style.zIndex = '10';
    
    // Add click handler to force open picker
    input.addEventListener('click', (e) => {
      if (e.target.showPicker) {
        try {
          e.target.showPicker();
        } catch (err) {
          console.log('showPicker not supported or failed');
        }
      }
    });
    
    // Handle focus/blur for z-index
    input.addEventListener('focus', (e) => {
      e.target.style.zIndex = '1010';
    });
    
    input.addEventListener('blur', (e) => {
      setTimeout(() => {
        e.target.style.zIndex = '10';
      }, 200);
    });
  });
};

// Run fix on component mount and when DOM changes
if (typeof window !== 'undefined') {
  // Run initially
  setTimeout(fixDatePickers, 100);
  
  // Run when DOM changes
  const observer = new MutationObserver(() => {
    fixDatePickers();
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Login Component
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

  useEffect(() => {
    fetchStats();
    
    // Subscribe to refresh events
    const unsubscribeAttendance = refreshEvents.subscribe('attendance', () => {
      fetchStats();
    });
    
    return () => {
      unsubscribeAttendance();
    };
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
    
    // Subscribe to attendance refresh events
    const unsubscribeAttendance = refreshEvents.subscribe('attendance', () => {
      fetchMyAttendance();
    });
    
    return () => {
      unsubscribeAttendance();
    };
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
        <div className="table-container">
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
                    <td>{formatDateDDMMYYYY(att.date)}</td>
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
    </div>
  );
}

// Site-wise Expense Report Component
function SiteExpenseReport() {
  const [sites, setSites] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedSite, setSelectedSite] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [siteExpenseData, setSiteExpenseData] = useState({});
  const [siteLabourData, setSiteLabourData] = useState({});
  const [siteIncomeData, setSiteIncomeData] = useState({});
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [selectedExpenseDetails, setSelectedExpenseDetails] = useState(null);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [selectedSiteForIncome, setSelectedSiteForIncome] = useState(null);
  const [incomeFormData, setIncomeFormData] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  useEffect(() => {
    fetchSites();
    fetchExpenses();
    fetchAttendance();
    fetchEmployees();
    
    // Subscribe to global refresh events
    const unsubscribeExpenses = refreshEvents.subscribe('expenses', () => {
      fetchExpenses();
      fetchAttendance();
    });
    
    const unsubscribeAttendance = refreshEvents.subscribe('attendance', () => {
      fetchAttendance();
    });
    
    return () => {
      unsubscribeExpenses();
      unsubscribeAttendance();
    };
  }, []);

  useEffect(() => {
    calculateSiteExpenses();
    calculateSiteLabourDays();
    calculateSiteIncome();
  }, [expenses, attendance, employees, selectedSite, selectedMonth, sites, siteExpenseData, siteLabourData]);

  const fetchSites = async () => {
    try {
      const timestamp = new Date().getTime();
      const response = await api.get(`/sites?_t=${timestamp}`);
      setSites(response.data.data || []);
    } catch (err) {
      console.error('Error fetching sites:', err);
    }
  };

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      // Add cache-busting parameter to ensure fresh data
      const timestamp = new Date().getTime();
      const response = await api.get(`/expenses?_t=${timestamp}`);
      setExpenses(response.data.data || []);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Error fetching expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = async () => {
    try {
      const timestamp = new Date().getTime();
      const response = await api.get(`/attendance?_t=${timestamp}`);
      setAttendance(response.data.data || []);
    } catch (err) {
      console.error('Error fetching attendance:', err);
    }
  };

  const fetchEmployees = async () => {
    try {
      const timestamp = new Date().getTime();
      const response = await api.get(`/employees?limit=1000&_t=${timestamp}`);
      setEmployees(response.data.data?.employees || []);
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

  const calculateSiteExpenses = () => {
    const [year, month] = selectedMonth.split('-');
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0);

    // Filter expenses by month and exclude Labour category
    const filteredExpenses = expenses.filter(exp => {
      const expDate = new Date(exp.date);
      const isInMonth = expDate >= monthStart && expDate <= monthEnd;
      const isNotLabour = exp.category !== 'Labour'; // Exclude employee costs
      const matchesSite = !selectedSite || exp.site?._id === selectedSite;
      
      return isInMonth && isNotLabour && matchesSite;
    });

    // Group by site
    const siteData = {};
    
    filteredExpenses.forEach(exp => {
      const siteId = exp.site?._id;
      const siteName = exp.site?.name || 'Unknown Site';
      
      if (!siteData[siteId]) {
        siteData[siteId] = {
          siteName,
          materials: 0,
          transport: 0,
          miscellaneous: 0,
          total: 0,
          expenses: [],
          materialExpenses: [],
          transportExpenses: [],
          miscellaneousExpenses: []
        };
      }
      
      siteData[siteId].expenses.push(exp);
      siteData[siteId][exp.category.toLowerCase()] += exp.amount;
      siteData[siteId].total += exp.amount;
      
      // Group expenses by category for detailed view
      if (exp.category === 'Materials') {
        siteData[siteId].materialExpenses.push(exp);
      } else if (exp.category === 'Transport') {
        siteData[siteId].transportExpenses.push(exp);
      } else if (exp.category === 'Miscellaneous') {
        siteData[siteId].miscellaneousExpenses.push(exp);
      }
    });

    setSiteExpenseData(siteData);
  };

  const calculateSiteIncome = () => {
    const incomeData = {};
    
    sites.forEach(site => {
      if (selectedSite && site._id !== selectedSite) return;
      
      const siteIncome = (site.incomePayments || []).reduce((sum, payment) => sum + payment.amount, 0);
      const siteExpenses = siteExpenseData[site._id]?.total || 0;
      const siteLabourCost = Object.values(siteLabourData[site._id]?.employees || {}).reduce((sum, emp) => sum + emp.totalWages, 0);
      
      incomeData[site._id] = {
        siteName: site.name,
        totalIncome: siteIncome,
        totalExpenses: siteExpenses + siteLabourCost,
        profit: siteIncome - (siteExpenses + siteLabourCost),
        incomePayments: site.incomePayments || []
      };
    });
    
    setSiteIncomeData(incomeData);
  };

  const handleAddIncome = (site) => {
    setSelectedSiteForIncome(site);
    setIncomeFormData({
      amount: '',
      date: new Date().toISOString().split('T')[0],
      description: ''
    });
    setShowIncomeModal(true);
  };

  const handleIncomeSubmit = async (e) => {
    e.preventDefault();
    
    if (!incomeFormData.amount || incomeFormData.amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      await api.post(`/sites/${selectedSiteForIncome._id}/income`, incomeFormData);
      setShowIncomeModal(false);
      await fetchSites();
      calculateSiteIncome();
      alert('Income added successfully!');
    } catch (err) {
      console.error('Error adding income:', err);
      alert(err.response?.data?.message || 'Error adding income');
    }
  };

  const calculateSiteLabourDays = () => {
      const [year, month] = selectedMonth.split('-');
      const monthStart = new Date(year, month - 1, 1);
      const monthEnd = new Date(year, month, 0);

      // Filter attendance by month
      const filteredAttendance = attendance.filter(att => {
        const attDate = new Date(att.date);
        const isInMonth = attDate >= monthStart && attDate <= monthEnd;
        const matchesSite = !selectedSite || att.site?._id === selectedSite;

        return isInMonth && matchesSite && (att.status === 'Present' || att.status === 'Half-Day');
      });

      // Group by site and employee
      const siteLabour = {};

      filteredAttendance.forEach(att => {
        const siteId = att.site?._id;
        const siteName = att.site?.name || 'Unknown Site';
        const employeeId = att.employee?._id;
        const employeeName = att.employee?.name || 'Unknown Employee';
        const employeeRole = att.employee?.role || 'Worker';

        if (!siteLabour[siteId]) {
          siteLabour[siteId] = {
            siteName,
            employees: {},
            totalWorkDays: 0,
            totalFullDays: 0,
            totalHalfDays: 0
          };
        }

        if (!siteLabour[siteId].employees[employeeId]) {
          siteLabour[siteId].employees[employeeId] = {
            name: employeeName,
            role: employeeRole,
            fullDays: 0,
            halfDays: 0,
            totalDays: 0,
            totalWages: 0,
            salaryAmount: att.employee?.salaryAmount || 0,
            salaryType: att.employee?.salaryType || 'daily'
          };
        }

        const employee = siteLabour[siteId].employees[employeeId];

        if (att.status === 'Present') {
          employee.fullDays++;
          siteLabour[siteId].totalFullDays++;
          employee.totalDays += 1; // Full day = 1
          siteLabour[siteId].totalWorkDays += 1; // Full day = 1
          // Calculate wage for full day
          if (employee.salaryType === 'daily') {
            employee.totalWages += employee.salaryAmount;
          }
        } else if (att.status === 'Half-Day') {
          employee.halfDays++;
          siteLabour[siteId].totalHalfDays++;
          employee.totalDays += 0.5; // Half day = 0.5
          siteLabour[siteId].totalWorkDays += 0.5; // Half day = 0.5
          // Calculate wage for half day
          if (employee.salaryType === 'daily') {
            employee.totalWages += employee.salaryAmount * 0.5;
          }
        }
      });

      setSiteLabourData(siteLabour);
    }

  const showExpenseDetails = (siteName, category, expenseList, totalAmount) => {
    setSelectedExpenseDetails({
      siteName,
      category,
      expenses: expenseList,
      totalAmount
    });
    setShowExpenseModal(true);
  };

  const exportToCSV = () => {
    const csvData = [];
    
    // Header for expenses
    csvData.push(['SITE EXPENSE REPORT - ' + selectedMonth]);
    csvData.push(['Site Name', 'Materials', 'Transport', 'Miscellaneous', 'Total Expenses']);
    
    Object.values(siteExpenseData).forEach(site => {
      csvData.push([
        site.siteName,
        site.materials,
        site.transport,
        site.miscellaneous,
        site.total
      ]);
    });
    
    csvData.push(['']); // Empty row
    
    // Header for labour days
    csvData.push(['LABOUR WORK DAYS REPORT - ' + selectedMonth]);
    csvData.push(['Site Name', 'Employee Name', 'Role', 'Full Days', 'Half Days', 'Total Days', 'Total Wages']);
    
    Object.values(siteLabourData).forEach(site => {
      Object.values(site.employees).forEach(emp => {
        csvData.push([
          site.siteName,
          emp.name,
          emp.role,
          emp.fullDays,
          emp.halfDays,
          emp.totalDays,
          emp.totalWages
        ]);
      });
    });
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `site-report-${selectedMonth}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="site-expense-report">
      <div className="header">
        <h2>Site-wise Reports</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={exportToCSV} style={{ background: '#28a745' }}>
            Export CSV
          </button>
          <button onClick={async () => { 
            setRefreshing(true);
            try {
              // Force refresh all data with cache busting
              await Promise.all([
                fetchExpenses(), 
                fetchAttendance(), 
                fetchSites(),
                fetchEmployees()
              ]);
            } finally {
              setRefreshing(false);
            }
          }} style={{ background: '#17a2b8' }} disabled={refreshing}>
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>
      </div>

      <div className="report-filters">
        <select 
          value={selectedSite}
          onChange={(e) => setSelectedSite(e.target.value)}
          style={{ marginRight: '10px', padding: '8px' }}
        >
          <option value="">All Sites</option>
          {sites.map((site) => (
            <option key={site._id} value={site._id}>{site.name}</option>
          ))}
        </select>
        
        <input 
          type="month" 
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          style={{ padding: '8px' }}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Loading report data...</p>
        </div>
      ) : (
        <>
          {/* Income & Profit Summary */}
          <div className="report-section">
            <h3>💵 Income & Profit Analysis</h3>
            <div className="income-summary-cards">
              {Object.entries(siteIncomeData).map(([siteId, data]) => (
                <div key={siteId} className="site-income-card">
                  <h4>{data.siteName}</h4>
                  <div className="income-breakdown">
                    <div className="income-item">
                      <span className="income-label">Total Income</span>
                      <span className="income-amount positive">₹{data.totalIncome.toLocaleString()}</span>
                    </div>
                    <div className="income-item">
                      <span className="income-label">Total Expenses</span>
                      <span className="income-amount negative">₹{data.totalExpenses.toLocaleString()}</span>
                    </div>
                    <div className={`income-item profit ${data.profit >= 0 ? 'positive' : 'negative'}`}>
                      <span className="income-label">{data.profit >= 0 ? 'Profit' : 'Loss'}</span>
                      <span className="income-amount">₹{Math.abs(data.profit).toLocaleString()}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleAddIncome(sites.find(s => s._id === siteId))}
                    className="add-income-btn"
                  >
                    + Add Income
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Expense Summary Cards */}
          <div className="report-section">
            <h3>💰 Material & Transport Expenses</h3>
            <div className="expense-summary-cards">
              {Object.entries(siteExpenseData).map(([siteId, data]) => (
                <div key={siteId} className="site-expense-card">
                  <h4>{data.siteName}</h4>
                  <div className="expense-breakdown">
                    <div 
                      className="expense-item materials clickable" 
                      onClick={() => showExpenseDetails(data.siteName, 'Materials', data.materialExpenses, data.materials)}
                    >
                      <span className="expense-icon">🧱</span>
                      <div>
                        <div className="expense-label">Materials</div>
                        <div className="expense-amount">₹{data.materials.toLocaleString()}</div>
                        <div className="click-hint">Click for details</div>
                      </div>
                    </div>
                    <div 
                      className="expense-item transport clickable"
                      onClick={() => showExpenseDetails(data.siteName, 'Transport', data.transportExpenses, data.transport)}
                    >
                      <span className="expense-icon">🚚</span>
                      <div>
                        <div className="expense-label">Transport</div>
                        <div className="expense-amount">₹{data.transport.toLocaleString()}</div>
                        <div className="click-hint">Click for details</div>
                      </div>
                    </div>
                    <div 
                      className="expense-item miscellaneous clickable"
                      onClick={() => showExpenseDetails(data.siteName, 'Miscellaneous', data.miscellaneousExpenses, data.miscellaneous)}
                    >
                      <span className="expense-icon">📦</span>
                      <div>
                        <div className="expense-label">Miscellaneous</div>
                        <div className="expense-amount">₹{data.miscellaneous.toLocaleString()}</div>
                        <div className="click-hint">Click for details</div>
                      </div>
                    </div>
                    <div className="expense-total">
                      <strong>Total: ₹{data.total.toLocaleString()}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Labour Days Summary Cards */}
          <div className="report-section">
            <h3>👷 Labour Work Days</h3>
            <div className="labour-summary-cards">
              {Object.entries(siteLabourData).map(([siteId, data]) => (
                <div key={siteId} className="site-labour-card">
                  <h4>{data.siteName}</h4>
                  <div className="labour-summary">
                    <div className="labour-stats">
                      <div className="stat-item">
                        <span className="stat-number">{data.totalWorkDays}</span>
                        <span className="stat-label">Total Work Days</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-number">{data.totalFullDays}</span>
                        <span className="stat-label">Full Days</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-number">{data.totalHalfDays}</span>
                        <span className="stat-label">Half Days</span>
                      </div>
                    </div>
                    
                    <div className="employee-list">
                      <h5>Employee Work Details:</h5>
                      {Object.values(data.employees).map((emp, index) => (
                        <div key={index} className="employee-work-item">
                          <div className="employee-info">
                            <strong>{emp.name}</strong>
                            <span className="employee-role">({emp.role})</span>
                          </div>
                          <div className="work-details">
                            <span className="work-days">
                              {emp.fullDays} full + {emp.halfDays} half = {emp.totalDays} days
                            </span>
                            <span className="work-wages">₹{emp.totalWages.toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                      
                      {/* Total Row */}
                      <div className="employee-work-item total-row">
                        <div className="employee-info">
                          <strong>TOTAL</strong>
                        </div>
                        <div className="work-details">
                          <span className="work-days">
                            {data.totalFullDays} full + {data.totalHalfDays} half = {data.totalFullDays + (data.totalHalfDays * 0.5)} days
                          </span>
                          <span className="work-wages total-wages">
                            ₹{Object.values(data.employees).reduce((sum, emp) => sum + emp.totalWages, 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {(Object.keys(siteExpenseData).length === 0 && Object.keys(siteLabourData).length === 0) && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <p>No data found for the selected criteria.</p>
              <p>Try selecting a different month or site.</p>
            </div>
          )}
        </>
      )}

      {/* Expense Details Modal */}
      {showExpenseModal && selectedExpenseDetails && (
        <div className="modal-overlay" onClick={() => setShowExpenseModal(false)}>
          <div className="expense-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedExpenseDetails.category} Expenses - {selectedExpenseDetails.siteName}</h3>
              <button className="close-btn" onClick={() => setShowExpenseModal(false)}>×</button>
            </div>
            <div className="modal-content">
              <div className="expense-total-header">
                <strong>Total {selectedExpenseDetails.category}: ₹{selectedExpenseDetails.totalAmount.toLocaleString()}</strong>
              </div>
              <div className="expense-details-list">
                {selectedExpenseDetails.expenses.length > 0 ? (
                  selectedExpenseDetails.expenses.map((exp, index) => (
                    <div key={index} className="expense-detail-item">
                      <div className="expense-date">
                        {formatDateDDMMYYYY(exp.date)}
                      </div>
                      <div className="expense-description">
                        <strong>{exp.description || 'No description provided'}</strong>
                      </div>
                      <div className="expense-amount-detail">
                        ₹{exp.amount.toLocaleString()}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-expenses">
                    <p>No {selectedExpenseDetails.category.toLowerCase()} expenses found for this period.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Income Modal */}
      {showIncomeModal && selectedSiteForIncome && (
        <div className="modal-overlay" onClick={() => setShowIncomeModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Income - {selectedSiteForIncome.name}</h3>
              <button className="close-btn" onClick={() => setShowIncomeModal(false)}>×</button>
            </div>
            <form onSubmit={handleIncomeSubmit} className="income-form">
              <div className="form-group">
                <label>Amount Received *</label>
                <input
                  type="number"
                  value={incomeFormData.amount}
                  onChange={(e) => setIncomeFormData({ ...incomeFormData, amount: e.target.value })}
                  min="1"
                  step="1"
                  required
                  placeholder="Enter amount received"
                />
              </div>

              <div className="form-group">
                <label>Date *</label>
                <input
                  type="date"
                  value={incomeFormData.date}
                  onChange={(e) => setIncomeFormData({ ...incomeFormData, date: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={incomeFormData.description}
                  onChange={(e) => setIncomeFormData({ ...incomeFormData, description: e.target.value })}
                  placeholder="e.g., Payment from client, Advance payment"
                  rows="3"
                  maxLength="200"
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowIncomeModal(false)} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Add Income
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Labour Reports Component - Separate page for labour work days
function LabourReports() {
  const [sites, setSites] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedSite, setSelectedSite] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [siteLabourData, setSiteLabourData] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSites();
    fetchAttendance();
    fetchEmployees();
    
    // Subscribe to attendance refresh events
    const unsubscribeAttendance = refreshEvents.subscribe('attendance', () => {
      fetchAttendance();
    });
    
    return () => {
      unsubscribeAttendance();
    };
  }, []);

  useEffect(() => {
    calculateSiteLabourDays();
  }, [attendance, employees, selectedSite, selectedMonth]);

  const fetchSites = async () => {
    try {
      const timestamp = new Date().getTime();
      const response = await api.get(`/sites?_t=${timestamp}`);
      setSites(response.data.data || []);
    } catch (err) {
      console.error('Error fetching sites:', err);
    }
  };

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const timestamp = new Date().getTime();
      const response = await api.get(`/attendance?_t=${timestamp}`);
      setAttendance(response.data.data || []);
    } catch (err) {
      console.error('Error fetching attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const timestamp = new Date().getTime();
      const response = await api.get(`/employees?limit=1000&_t=${timestamp}`);
      setEmployees(response.data.data?.employees || []);
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

  const calculateSiteLabourDays = () => {
    const [year, month] = selectedMonth.split('-');
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0);

    // Filter attendance by month
    const filteredAttendance = attendance.filter(att => {
      const attDate = new Date(att.date);
      const isInMonth = attDate >= monthStart && attDate <= monthEnd;
      const matchesSite = !selectedSite || att.site?._id === selectedSite;
      
      return isInMonth && matchesSite && (att.status === 'Present' || att.status === 'Half-Day');
    });

    // Group by site and employee
    const siteLabour = {};
    
    filteredAttendance.forEach(att => {
      const siteId = att.site?._id;
      const siteName = att.site?.name || 'Unknown Site';
      const employeeId = att.employee?._id;
      const employeeName = att.employee?.name || 'Unknown Employee';
      const employeeRole = att.employee?.role || 'Worker';
      
      if (!siteLabour[siteId]) {
        siteLabour[siteId] = {
          siteName,
          employees: {},
          totalWorkDays: 0,
          totalFullDays: 0,
          totalHalfDays: 0
        };
      }
      
      if (!siteLabour[siteId].employees[employeeId]) {
        siteLabour[siteId].employees[employeeId] = {
          name: employeeName,
          role: employeeRole,
          fullDays: 0,
          halfDays: 0,
          totalDays: 0,
          totalWages: 0,
          salaryAmount: att.employee?.salaryAmount || 0,
          salaryType: att.employee?.salaryType || 'daily'
        };
      }
      
      const employee = siteLabour[siteId].employees[employeeId];
      
      if (att.status === 'Present') {
        employee.fullDays++;
        siteLabour[siteId].totalFullDays++;
        employee.totalDays += 1; // Full day = 1
        siteLabour[siteId].totalWorkDays += 1; // Full day = 1
        // Calculate wage for full day
        if (employee.salaryType === 'daily') {
          employee.totalWages += employee.salaryAmount;
        }
      } else if (att.status === 'Half-Day') {
        employee.halfDays++;
        siteLabour[siteId].totalHalfDays++;
        employee.totalDays += 0.5; // Half day = 0.5
        siteLabour[siteId].totalWorkDays += 0.5; // Half day = 0.5
        // Calculate wage for half day
        if (employee.salaryType === 'daily') {
          employee.totalWages += employee.salaryAmount * 0.5;
        }
      }
    });

    setSiteLabourData(siteLabour);
  };

  const exportToCSV = () => {
    const csvData = [];
    
    // Header for labour days
    csvData.push(['LABOUR WORK DAYS REPORT - ' + selectedMonth]);
    csvData.push(['Site Name', 'Employee Name', 'Role', 'Full Days', 'Half Days', 'Total Days', 'Total Wages']);
    
    Object.values(siteLabourData).forEach(site => {
      Object.values(site.employees).forEach(emp => {
        csvData.push([
          site.siteName,
          emp.name,
          emp.role,
          emp.fullDays,
          emp.halfDays,
          emp.totalDays,
          emp.totalWages
        ]);
      });
    });
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `labour-report-${selectedMonth}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="labour-reports">
      <div className="header">
        <h2>Labour Work Days Reports</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={exportToCSV} style={{ background: '#27ae60' }}>
            Export CSV
          </button>
          <button onClick={() => { fetchAttendance(); }} style={{ background: '#17a2b8' }}>
            Refresh Data
          </button>
        </div>
      </div>

      <div className="report-filters">
        <select 
          value={selectedSite}
          onChange={(e) => setSelectedSite(e.target.value)}
          style={{ marginRight: '10px', padding: '8px' }}
        >
          <option value="">All Sites</option>
          {sites.map((site) => (
            <option key={site._id} value={site._id}>{site.name}</option>
          ))}
        </select>
        
        <input 
          type="month" 
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          style={{ padding: '8px' }}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Loading labour report data...</p>
        </div>
      ) : (
        <>
          {/* Labour Days Summary Cards */}
          <div className="report-section">
            <h3>👷 Labour Work Days by Site</h3>
            <div className="labour-summary-cards">
              {Object.entries(siteLabourData).map(([siteId, data]) => (
                <div key={siteId} className="site-labour-card">
                  <h4>{data.siteName}</h4>
                  <div className="labour-summary">
                    <div className="labour-stats">
                      <div className="stat-item">
                        <span className="stat-number">{data.totalWorkDays}</span>
                        <span className="stat-label">Total Work Days</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-number">{data.totalFullDays}</span>
                        <span className="stat-label">Full Days</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-number">{data.totalHalfDays}</span>
                        <span className="stat-label">Half Days</span>
                      </div>
                    </div>
                    
                    <div className="employee-list">
                      <h5>Employee Work Details:</h5>
                      {Object.values(data.employees).map((emp, index) => (
                        <div key={index} className="employee-work-item">
                          <div className="employee-info">
                            <strong>{emp.name}</strong>
                            <span className="employee-role">({emp.role})</span>
                          </div>
                          <div className="work-details">
                            <span className="work-days">
                              {emp.fullDays} full + {emp.halfDays} half = {emp.totalDays} days
                            </span>
                            <span className="work-wages">₹{emp.totalWages.toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                      
                      {/* Total Row */}
                      <div className="employee-work-item total-row">
                        <div className="employee-info">
                          <strong>TOTAL</strong>
                        </div>
                        <div className="work-details">
                          <span className="work-days">
                            {data.totalFullDays} full + {data.totalHalfDays} half = {data.totalFullDays + (data.totalHalfDays * 0.5)} days
                          </span>
                          <span className="work-wages total-wages">
                            ₹{Object.values(data.employees).reduce((sum, emp) => sum + emp.totalWages, 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {Object.keys(siteLabourData).length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <p>No labour data found for the selected criteria.</p>
              <p>Try selecting a different month or site.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Employees Component
function Employees() {
  const [employees, setEmployees] = useState([]);
  const [employeeStats, setEmployeeStats] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [salaryFormData, setSalaryFormData] = useState({
    newAmount: '',
    effectiveDate: new Date().toISOString().split('T')[0],
    reason: ''
  });
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
      setLoading(true);
      setError('');
      console.log('Fetching employees from API...');
      
      // First, try to get a valid token from localStorage
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      console.log('Current user:', user);
      console.log('Has token:', !!token);
      
      if (!token || !user.role) {
        console.log('No valid authentication found, trying public endpoints...');
        
        // Try public endpoints first
        try {
          console.log('Trying public/all endpoint...');
          const publicAllResponse = await axios.get(`${API_URL}/employees/public/all`);
          const publicAllEmployees = publicAllResponse.data.data?.employees || [];
          console.log('Public all employees response:', publicAllEmployees);
          setEmployees(publicAllEmployees);
          
          if (publicAllEmployees.length === 0) {
            setError('No employees found in database. Create your first employee using the "Add Employee" button.');
          }
          return;
        } catch (publicAllErr) {
          console.log('Public/all endpoint failed:', publicAllErr.response?.data);
          
          // Fallback to public/active
          try {
            console.log('Trying public/active endpoint...');
            const publicActiveResponse = await axios.get(`${API_URL}/employees/public/active`);
            const publicActiveEmployees = publicActiveResponse.data.data || [];
            console.log('Public active employees response:', publicActiveEmployees);
            setEmployees(publicActiveEmployees);
            
            if (publicActiveEmployees.length === 0) {
              setError('No active employees found. Create your first employee using the "Add Employee" button.');
            }
            return;
          } catch (publicActiveErr) {
            console.error('All public endpoints failed, trying direct endpoint...');
            
            // Final fallback: direct endpoint
            try {
              console.log('Trying direct employees endpoint...');
              const directResponse = await axios.get(`${API_URL}/employees-direct`);
              const directEmployees = directResponse.data.data?.employees || [];
              console.log('Direct employees response:', directEmployees);
              setEmployees(directEmployees);
              setError('');
              
              if (directEmployees.length === 0) {
                setError('No employees found in database. Create your first employee using the "Add Employee" button.');
              }
            } catch (directErr) {
              console.error('Direct endpoint also failed:', directErr.response?.data);
              setError('Unable to load employees. The backend may be updating. Please try again in a few minutes.');
              setEmployees([]);
            }
          }
        }
      }
      
      // If we have authentication, try the authenticated endpoint
      console.log('Trying authenticated endpoint...');
      const response = await api.get('/employees?limit=1000');
      console.log('Employees API response:', response.data);
      
      const employeesList = response.data.data?.employees || [];
      console.log('Setting employees list:', employeesList);
      console.log('Number of employees found:', employeesList.length);
      
      setEmployees(employeesList);
      
      if (employeesList.length === 0) {
        setError('No employees found in database. Create your first employee using the "Add Employee" button.');
      }
      
    } catch (err) {
      console.error('Error fetching employees:', err);
      console.error('Error response:', err.response?.data);
      
      // If authenticated call fails, try public endpoints as fallback
      if (err.response?.status === 401 || err.response?.status === 403) {
        console.log('Authentication failed, trying public endpoints...');
        
        try {
          console.log('Trying public/all endpoint as fallback...');
          const publicAllResponse = await axios.get(`${API_URL}/employees/public/all`);
          const publicAllEmployees = publicAllResponse.data.data?.employees || [];
          console.log('Public all employees fallback response:', publicAllEmployees);
          setEmployees(publicAllEmployees);
          setError('');
          
          if (publicAllEmployees.length === 0) {
            setError('No employees found in database. Create your first employee using the "Add Employee" button.');
          }
        } catch (publicAllErr) {
          console.error('Public/all fallback failed:', publicAllErr.response?.data);
          
          try {
            console.log('Trying public/active endpoint as final fallback...');
            const publicActiveResponse = await axios.get(`${API_URL}/employees/public/active`);
            const publicActiveEmployees = publicActiveResponse.data.data || [];
            console.log('Public active employees final fallback:', publicActiveEmployees);
            setEmployees(publicActiveEmployees);
            setError('');
            
            if (publicActiveEmployees.length === 0) {
              setError('No active employees found. Create your first employee using the "Add Employee" button.');
            }
          } catch (publicActiveErr) {
            console.error('All endpoints failed, trying direct endpoint...');
            
            // Final fallback: direct endpoint
            try {
              console.log('Trying direct employees endpoint as final fallback...');
              const directResponse = await axios.get(`${API_URL}/employees-direct`);
              const directEmployees = directResponse.data.data?.employees || [];
              console.log('Direct employees final fallback:', directEmployees);
              setEmployees(directEmployees);
              setError('');
              
              if (directEmployees.length === 0) {
                setError('No employees found in database. Create your first employee using the "Add Employee" button.');
              }
            } catch (directErr) {
              console.error('All endpoints including direct failed:', directErr.response?.data);
              setError('Unable to load employees. The backend may be updating. Please try again in a few minutes.');
              setEmployees([]);
            }
          }
        }
      } else {
        setError('Unable to load employees. Please check your connection and try again.');
        setEmployees([]);
      }
    } finally {
      setLoading(false);
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
            stats[empId] = { 
              totalDays: 0, 
              presentDays: 0, 
              halfDays: 0,
              totalHours: 0,
              totalWageEarned: 0
            };
          }
          stats[empId].totalDays++;
          
          if (att.status === 'Present') {
            stats[empId].presentDays++;
          } else if (att.status === 'Half-Day') {
            stats[empId].halfDays++;
          }
          
          stats[empId].totalHours += att.hoursWorked || 0;
          stats[empId].totalWageEarned += att.wageEarned || 0;
        }
      });
      
      setEmployeeStats(stats);
    } catch (err) {
      console.error('Error fetching employee stats:', err);
    }
  };

  const calculatePayment = (emp, stats) => {
    const { presentDays = 0, halfDays = 0, totalWageEarned = 0 } = stats;
    const salaryAmount = emp.salaryAmount || 0;
    const totalAdvance = emp.totalAdvance || 0;
    
    let totalEarned = 0;
    if (emp.salaryType === 'daily') {
      // Always calculate based on present days and half days to ensure accuracy
      totalEarned = (presentDays * salaryAmount) + (halfDays * salaryAmount * 0.5);
    } else {
      // For monthly, assume full month salary
      totalEarned = salaryAmount;
    }
    
    const pending = totalEarned - totalAdvance;
    
    return {
      totalEarned,
      totalPaid: totalAdvance,
      pending: Math.max(0, pending),
      overpaid: pending < 0 ? Math.abs(pending) : 0,
      workingDays: presentDays + (halfDays * 0.5),
      fullDays: presentDays,
      halfDays: halfDays
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('Submitting employee data:', formData);
    
    // Frontend validation with more lenient rules
    if (!formData.name.trim()) {
      alert('Employee name is required');
      return;
    }
    
    if (formData.name.trim().length < 2) {
      alert('Employee name must be at least 2 characters long');
      return;
    }
    
    if (!formData.phone.trim()) {
      alert('Phone number is required');
      return;
    }
    
    // More flexible phone validation - allow any 10 digit number
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(formData.phone)) {
      alert('Please enter a valid 10-digit phone number');
      return;
    }
    
    if (!formData.role.trim()) {
      alert('Employee role is required');
      return;
    }
    
    if (!formData.salaryAmount || formData.salaryAmount <= 0) {
      alert('Please enter a valid salary amount');
      return;
    }
    
    try {
      console.log('Sending POST request to /employees');
      const response = await api.post('/employees', {
        ...formData,
        salaryAmount: parseFloat(formData.salaryAmount)
      });
      console.log('Employee creation response:', response.data);
      
      setShowForm(false);
      setFormData({ name: '', phone: '', role: '', salaryType: 'daily', salaryAmount: '' });
      
      console.log('Fetching updated employee list...');
      await fetchEmployees();
      alert('Employee created successfully!');
    } catch (err) {
      console.error('Error creating employee:', err);
      console.error('Error response:', err.response?.data);
      
      // More detailed error handling
      if (err.response?.status === 400) {
        const errorData = err.response.data;
        if (errorData.message?.includes('phone number already exists')) {
          alert('An employee with this phone number already exists. Please use a different phone number.');
        } else if (errorData.errors && Array.isArray(errorData.errors)) {
          alert('Validation errors:\n' + errorData.errors.join('\n'));
        } else {
          alert(errorData.message || 'Validation failed. Please check your input.');
        }
      } else if (err.response?.status === 401) {
        alert('Authentication failed. Please login again.');
      } else if (err.response?.status === 403) {
        alert('You do not have permission to create employees.');
      } else {
        const errorMessage = err.response?.data?.message || 'Error creating employee. Please try again.';
        alert(errorMessage);
      }
    }
  };

  const handleDelete = async (id) => {
    console.log('Delete button clicked for employee ID:', id);
    if (window.confirm('Are you sure you want to delete this employee? This will mark them as inactive.')) {
      try {
        console.log('Sending DELETE request for employee:', id);
        const response = await api.delete(`/employees/${id}`);
        console.log('Employee deletion response:', response.data);
        
        // Refresh the employee list
        await fetchEmployees();
        alert('Employee marked as inactive successfully!');
      } catch (err) {
        console.error('Error deleting employee:', err);
        console.error('Error response:', err.response?.data);
        
        // Provide more specific error messages
        if (err.response?.status === 401) {
          alert('Authentication failed. Please login again.');
        } else if (err.response?.status === 403) {
          alert('You do not have permission to delete employees.');
        } else if (err.response?.status === 404) {
          alert('Employee not found.');
        } else {
          const errorMessage = err.response?.data?.message || 'Error deleting employee. Please try again.';
          alert(errorMessage);
        }
      }
    } else {
      console.log('Delete cancelled by user');
    }
  };

  const handleEditSalary = (emp) => {
    setSelectedEmployee(emp);
    setSalaryFormData({
      newAmount: emp.salaryAmount,
      effectiveDate: new Date().toISOString().split('T')[0],
      reason: ''
    });
    setShowSalaryModal(true);
  };

  const handleSalaryUpdate = async (e) => {
    e.preventDefault();
    
    if (!salaryFormData.newAmount || salaryFormData.newAmount <= 0) {
      alert('Please enter a valid salary amount');
      return;
    }

    try {
      await api.put(`/employees/${selectedEmployee._id}/salary`, {
        newAmount: parseFloat(salaryFormData.newAmount),
        effectiveDate: salaryFormData.effectiveDate,
        reason: salaryFormData.reason
      });
      
      setShowSalaryModal(false);
      setSelectedEmployee(null);
      setSalaryFormData({ newAmount: '', effectiveDate: new Date().toISOString().split('T')[0], reason: '' });
      await fetchEmployees();
      alert('Salary updated successfully!');
    } catch (err) {
      console.error('Error updating salary:', err);
      const errorMessage = err.response?.data?.message || 'Error updating salary. Please try again.';
      alert(errorMessage);
    }
  };

  return (
    <div className="employees">
      <div className="header">
        <h2>Employees</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'Add Employee'}
          </button>
          <button onClick={fetchEmployees} style={{ background: '#28a745' }}>
            Refresh List
          </button>
          <button 
            onClick={() => {
              console.log('Current employees state:', employees);
              console.log('Employees length:', employees.length);
              console.log('Loading state:', loading);
              console.log('Error state:', error);
              alert(`Employees: ${employees.length}, Loading: ${loading}, Error: ${error || 'None'}`);
            }}
            style={{ background: '#17a2b8', fontSize: '12px' }}
          >
            Debug Info
          </button>
        </div>
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
            type="tel"
            placeholder="Phone Number (10 digits)"
            value={formData.phone}
            onChange={(e) => {
              // Only allow digits and limit to 10 characters
              const value = e.target.value.replace(/\D/g, '').slice(0, 10);
              setFormData({ ...formData, phone: value });
            }}
            maxLength="10"
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
            min="1"
            step="1"
            required
          />
          <button type="submit">Create Employee</button>
        </form>
      )}

      <div className="table-container">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>Loading employees...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#e74c3c' }}>
            <p>{error}</p>
            <button onClick={fetchEmployees} style={{ marginTop: '10px' }}>
              Retry Loading
            </button>
          </div>
        ) : (
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
              {employees.length > 0 ? (
                employees.map((emp) => {
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
                        <div>
                          <span className="stats-badge">{payment.workingDays} days</span>
                          {payment.halfDays > 0 && (
                            <div style={{fontSize: '11px', color: '#f39c12', marginTop: '2px'}}>
                              {payment.fullDays} full + {payment.halfDays} half
                            </div>
                          )}
                        </div>
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
                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                          <button 
                            onClick={() => handleEditSalary(emp)} 
                            className="edit-salary-btn"
                            style={{ background: '#3498db', color: 'white', padding: '5px 10px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                          >
                            Edit Salary
                          </button>
                          <button onClick={() => handleDelete(emp._id)} className="delete-btn">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="10" className="no-employees">
                    No employees found. Click "Add Employee" to create your first employee.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Salary Edit Modal */}
      {showSalaryModal && selectedEmployee && (
        <div className="modal-overlay" onClick={() => setShowSalaryModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Salary - {selectedEmployee.name}</h3>
              <button className="close-btn" onClick={() => setShowSalaryModal(false)}>×</button>
            </div>
            <form onSubmit={handleSalaryUpdate} className="salary-form">
              <div className="form-group">
                <label>Current Salary</label>
                <div className="current-salary">
                  ₹{selectedEmployee.salaryAmount} ({selectedEmployee.salaryType})
                </div>
              </div>
              
              <div className="form-group">
                <label>New Salary Amount *</label>
                <input
                  type="number"
                  value={salaryFormData.newAmount}
                  onChange={(e) => setSalaryFormData({ ...salaryFormData, newAmount: e.target.value })}
                  min="1"
                  step="1"
                  required
                  placeholder="Enter new salary amount"
                />
              </div>

              <div className="form-group">
                <label>Effective Date *</label>
                <input
                  type="date"
                  value={salaryFormData.effectiveDate}
                  onChange={(e) => setSalaryFormData({ ...salaryFormData, effectiveDate: e.target.value })}
                  required
                />
                <small style={{ color: '#999', fontSize: '12px' }}>
                  This date will be used to track when the salary change took effect
                </small>
              </div>

              <div className="form-group">
                <label>Reason for Change</label>
                <textarea
                  value={salaryFormData.reason}
                  onChange={(e) => setSalaryFormData({ ...salaryFormData, reason: e.target.value })}
                  placeholder="e.g., Annual increment, Performance bonus, Promotion"
                  rows="3"
                  maxLength="200"
                />
                <small style={{ color: '#999', fontSize: '12px' }}>
                  Optional: Add a reason for this salary change (max 200 characters)
                </small>
              </div>

              {selectedEmployee.salaryHistory && selectedEmployee.salaryHistory.length > 0 && (
                <div className="salary-history">
                  <h4>Salary History</h4>
                  <div className="history-list">
                    {selectedEmployee.salaryHistory.slice(-3).reverse().map((history, index) => (
                      <div key={index} className="history-item">
                        <div className="history-amount">₹{history.amount}</div>
                        <div className="history-date">{formatDateDDMMYYYY(history.effectiveDate)}</div>
                        {history.reason && <div className="history-reason">{history.reason}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="modal-actions">
                <button type="button" onClick={() => setShowSalaryModal(false)} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Update Salary
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Sites Component
function Sites() {
  const [sites, setSites] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
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

  const handleEdit = (site) => {
    setEditingId(site._id);
    setFormData({
      name: site.name,
      location: site.location,
      startDate: site.startDate.split('T')[0],
      status: site.status,
      latitude: site.coordinates?.latitude || '',
      longitude: site.coordinates?.longitude || '',
      allowedRadius: site.allowedRadius || 200
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this site?')) {
      try {
        await api.delete(`/sites/${id}`);
        fetchSites();
      } catch (err) {
        alert(err.response?.data?.message || 'Error deleting site');
      }
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
      
      if (editingId) {
        // Update existing site
        await api.put(`/sites/${editingId}`, payload);
      } else {
        // Create new site
        await api.post('/sites', payload);
      }
      
      setShowForm(false);
      setEditingId(null);
      setFormData({ name: '', location: '', startDate: '', status: 'Active', latitude: '', longitude: '', allowedRadius: 200 });
      fetchSites();
    } catch (err) {
      alert(err.response?.data?.message || `Error ${editingId ? 'updating' : 'creating'} site`);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', location: '', startDate: '', status: 'Active', latitude: '', longitude: '', allowedRadius: 200 });
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
            onClick={(e) => {
              // Ensure the date picker opens
              e.target.showPicker && e.target.showPicker();
            }}
            onFocus={(e) => {
              // Set z-index when focused
              e.target.style.zIndex = '1010';
            }}
            onBlur={(e) => {
              // Reset z-index when blurred
              setTimeout(() => {
                e.target.style.zIndex = '10';
              }, 200);
            }}
            style={{ position: 'relative', zIndex: 10 }}
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
          <button type="submit" style={{gridColumn: 'span 2'}}>
            {editingId ? 'Update Site' : 'Create Site'}
          </button>
          {editingId && (
            <button type="button" onClick={handleCancel} style={{gridColumn: 'span 2', background: '#6c757d'}}>
              Cancel Edit
            </button>
          )}
        </form>
      )}

      <div className="sites-grid">
        {sites.map((site) => (
          <div key={site._id} className="site-card">
            <h3>{site.name}</h3>
            <p><strong>Location:</strong> {site.location}</p>
            <p><strong>Status:</strong> <span className={`status ${site.status.toLowerCase()}`}>{site.status}</span></p>
            <p><strong>Start Date:</strong> {formatDateDDMMYYYY(site.startDate)}</p>
            {site.coordinates && site.coordinates.latitude && (
              <p><strong>GPS:</strong> {site.coordinates.latitude.toFixed(6)}, {site.coordinates.longitude.toFixed(6)}</p>
            )}
            {site.allowedRadius && (
              <p><strong>Radius:</strong> {site.allowedRadius}m</p>
            )}
            <p><strong>Expenses:</strong> ₹{site.totalExpenses?.toLocaleString() || 0}</p>
            <div className="card-actions">
              <button onClick={() => handleEdit(site)} className="edit-btn">Edit</button>
              <button onClick={() => handleDelete(site._id)} className="delete-btn">Delete</button>
            </div>
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
  const [selectedDate, setSelectedDate] = useState(null); // For date click modal
  const [showDateModal, setShowDateModal] = useState(false);
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
      console.log('Fetching attendance data...');
      const response = await api.get('/attendance');
      console.log('Attendance API response:', response.data);
      
      const attendanceData = response.data.data || [];
      console.log('Attendance records count:', attendanceData.length);
      
      // Log first record to check employee population
      if (attendanceData.length > 0) {
        console.log('First attendance record:', attendanceData[0]);
        console.log('Employee data in first record:', attendanceData[0].employee);
        console.log('Site data in first record:', attendanceData[0].site);
      }
      
      setAttendance(attendanceData);
    } catch (err) {
      console.error('Error fetching attendance:', err);
      console.error('Error response:', err.response?.data);
    }
  };

  const deleteAttendance = async (attendanceId, employeeName, date) => {
    if (!window.confirm(`Are you sure you want to delete attendance record for ${employeeName} on ${formatDateDDMMYYYY(date)}?\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      await api.delete(`/attendance/${attendanceId}`);
      
      // Refresh attendance data to update everywhere
      await fetchAttendance();
      
      // Emit refresh event to update other components
      refreshEvents.emit('attendance');
      
      alert('Attendance record deleted successfully!');
    } catch (err) {
      console.error('Error deleting attendance:', err);
      alert(err.response?.data?.message || 'Error deleting attendance record');
    }
  };

  const fetchEmployees = async () => {
    try {
      // Fetch all active employees without pagination limit
      const response = await api.get('/employees?limit=1000&isActive=true');
      const employeesList = response.data.data?.employees || [];
      setEmployees(employeesList);
    } catch (err) {
      console.error('Error fetching employees:', err);
      // Fallback to try without auth for public endpoints
      try {
        const publicResponse = await axios.get(`${API_URL}/employees/public/active`);
        setEmployees(publicResponse.data.data || []);
      } catch (publicErr) {
        console.error('Error fetching employees from public endpoint:', publicErr);
        setEmployees([]);
      }
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
      const halfDayCount = dayAttendance.filter(att => att.status === 'Half-Day').length;
      const leaveCount = dayAttendance.filter(att => att.status === 'Leave').length;
      
      // If filtering by employee, total is 1, otherwise all employees
      const totalEmployees = selectedEmployee ? 1 : employees.length;
      const absentCount = selectedEmployee 
        ? (dayAttendance.length === 0 ? 1 : 0) // If no record, employee is absent
        : Math.max(0, totalEmployees - presentCount - halfDayCount - leaveCount);
      
      week[dayOfWeek] = {
        day,
        dateStr,
        presentCount,
        halfDayCount,
        leaveCount,
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

  // Handle date click to show employee details
  const handleDateClick = (day) => {
    const dayAttendance = attendance.filter(att => 
      new Date(att.date).toISOString().split('T')[0] === day.dateStr
    );
    
    setSelectedDate({
      ...day,
      attendance: dayAttendance,
      formattedDate: formatDateDDMMYYYY(day.dateStr)
    });
    setShowDateModal(true);
  };

  return (
    <div className="attendance">
      <div className="header">
        <h2>Attendance</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'Mark Attendance'}
          </button>
          <button onClick={fetchAttendance} style={{ background: '#28a745' }}>
            Refresh Attendance
          </button>
          <button 
            onClick={() => {
              console.log('Current attendance state:', attendance);
              console.log('Attendance count:', attendance.length);
              if (attendance.length > 0) {
                console.log('First record:', attendance[0]);
                console.log('Employee in first record:', attendance[0].employee);
              }
              alert(`Attendance records: ${attendance.length}`);
            }}
            style={{ background: '#17a2b8', fontSize: '12px' }}
          >
            Debug Attendance
          </button>
        </div>
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
            onClick={(e) => {
              // Ensure the date picker opens
              e.target.showPicker && e.target.showPicker();
            }}
            onFocus={(e) => {
              // Set z-index when focused
              e.target.style.zIndex = '1010';
            }}
            onBlur={(e) => {
              // Reset z-index when blurred
              setTimeout(() => {
                e.target.style.zIndex = '10';
              }, 200);
            }}
            style={{ position: 'relative', zIndex: 10 }}
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
              <option value="2026-02">February 2026</option>
              <option value="2026-01">January 2026</option>
              <option value="2025-12">December 2025</option>
              <option value="2025-11">November 2025</option>
              <option value="2025-10">October 2025</option>
              <option value="2025-09">September 2025</option>
              <option value="2025-08">August 2025</option>
              <option value="2025-07">July 2025</option>
              <option value="2025-06">June 2025</option>
              <option value="2025-05">May 2025</option>
              <option value="2025-04">April 2025</option>
              <option value="2025-03">March 2025</option>
              <option value="2025-02">February 2025</option>
              <option value="2025-01">January 2025</option>
              <option value="2026-03">March 2026</option>
              <option value="2026-04">April 2026</option>
              <option value="2026-05">May 2026</option>
              <option value="2026-06">June 2026</option>
              <option value="2026-07">July 2026</option>
              <option value="2026-08">August 2026</option>
              <option value="2026-09">September 2026</option>
              <option value="2026-10">October 2026</option>
              <option value="2026-11">November 2026</option>
              <option value="2026-12">December 2026</option>
            </select>
          </div>
        </div>
        <div className="calendar">
          <div className="calendar-legend">
            <div className="legend-item">
              <div className="legend-color present"></div>
              <span>Present</span>
            </div>
            <div className="legend-item">
              <div className="legend-color halfday"></div>
              <span>Half-Day</span>
            </div>
            <div className="legend-item">
              <div className="legend-color leave"></div>
              <span>Leave</span>
            </div>
            <div className="legend-item">
              <div className="legend-color absent"></div>
              <span>Absent</span>
            </div>
          </div>
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
                    className={`calendar-day ${!day ? 'empty' : ''} ${day && !day.isPast ? 'future' : ''} ${day && day.presentCount > 0 ? 'has-present' : ''} ${day && day.halfDayCount > 0 ? 'has-halfday' : ''} ${day && day.leaveCount > 0 ? 'has-leave' : ''} ${day && day.absentCount > 0 && day.presentCount === 0 && day.halfDayCount === 0 && day.leaveCount === 0 ? 'has-absent' : ''} ${day ? 'clickable' : ''}`}
                    onClick={() => day && handleDateClick(day)}
                    style={{ cursor: day ? 'pointer' : 'default' }}
                  >
                    {day && (
                      <>
                        <div className="day-number">{day.day}</div>
                        <div className="day-stats">
                          {day.presentCount > 0 && (
                            <div className="present-count" title="Present">
                              ✓ {day.presentCount}
                            </div>
                          )}
                          {day.halfDayCount > 0 && (
                            <div className="halfday-count" title="Half-Day">
                              ◐ {day.halfDayCount}
                            </div>
                          )}
                          {day.leaveCount > 0 && (
                            <div className="leave-count" title="Leave">
                              🏖 {day.leaveCount}
                            </div>
                          )}
                          {day.absentCount > 0 && day.presentCount === 0 && day.halfDayCount === 0 && day.leaveCount === 0 && (
                            <div className="absent-count" title="Absent">
                              ✗ {day.absentCount}
                            </div>
                          )}
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

      <div className="table-container">
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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {attendance.map((att) => (
              <tr key={att._id}>
                <td>{formatDateDDMMYYYY(att.date)}</td>
                <td>
                  {att.employee ? (
                    <div>
                      <strong>{att.employee.name}</strong>
                      {att.employee.phone && <div style={{fontSize: '12px', color: '#666'}}>{att.employee.phone}</div>}
                      {att.employee.role && <div style={{fontSize: '11px', color: '#999'}}>{att.employee.role}</div>}
                    </div>
                  ) : (
                    <span style={{color: '#e74c3c'}}>Employee data missing</span>
                  )}
                </td>
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
                <td>
                  <button
                    onClick={() => deleteAttendance(att._id, att.employee?.name || 'Unknown Employee', att.date)}
                    className="delete-btn"
                    title="Delete attendance record"
                    style={{
                      background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
                      color: 'white',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '600',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 4px 12px rgba(255, 107, 107, 0.5)';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 2px 8px rgba(255, 107, 107, 0.3)';
                    }}
                  >
                    🗑️ Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Date Details Modal */}
      {showDateModal && selectedDate && (
        <div className="modal-overlay" onClick={() => setShowDateModal(false)}>
          <div className="date-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Attendance Details - {selectedDate.formattedDate}</h3>
              <button className="close-btn" onClick={() => setShowDateModal(false)}>×</button>
            </div>
            <div className="modal-content">
              <div className="date-summary">
                <div className="summary-stats">
                  <div className="stat-item present">
                    <span className="stat-icon">✓</span>
                    <span className="stat-number">{selectedDate.presentCount}</span>
                    <span className="stat-label">Present</span>
                  </div>
                  <div className="stat-item halfday">
                    <span className="stat-icon">◐</span>
                    <span className="stat-number">{selectedDate.halfDayCount}</span>
                    <span className="stat-label">Half-Day</span>
                  </div>
                  <div className="stat-item leave">
                    <span className="stat-icon">🏖</span>
                    <span className="stat-number">{selectedDate.leaveCount}</span>
                    <span className="stat-label">Leave</span>
                  </div>
                  <div className="stat-item absent">
                    <span className="stat-icon">✗</span>
                    <span className="stat-number">{selectedDate.absentCount}</span>
                    <span className="stat-label">Absent</span>
                  </div>
                </div>
              </div>
              
              <div className="employee-details-list">
                <h4>Employee Details:</h4>
                {selectedDate.attendance.length > 0 ? (
                  selectedDate.attendance.map((att, index) => (
                    <div key={index} className="employee-detail-item">
                      <div className="employee-info">
                        <div className="employee-name">{att.employee?.name || 'Unknown Employee'}</div>
                        <div className="employee-role">{att.employee?.role || 'N/A'}</div>
                        <div className="employee-phone">{att.employee?.phone || 'N/A'}</div>
                      </div>
                      <div className="attendance-info">
                        <div className="site-name">
                          <span className="label">Site:</span>
                          <span className="value">{att.site?.name || 'N/A'}</span>
                        </div>
                        <div className="status-info">
                          <span className="label">Status:</span>
                          <span className={`status-badge ${att.status.toLowerCase()}`}>{att.status}</span>
                        </div>
                        <div className="time-info">
                          <span className="label">Time:</span>
                          <span className="value">
                            {att.clockIn ? new Date(att.clockIn).toLocaleTimeString() : 'N/A'} - 
                            {att.clockOut ? new Date(att.clockOut).toLocaleTimeString() : 'N/A'}
                          </span>
                        </div>
                        {att.hoursWorked && (
                          <div className="hours-info">
                            <span className="label">Hours:</span>
                            <span className="value">{att.hoursWorked}h</span>
                          </div>
                        )}
                        <div className="attendance-actions">
                          <button
                            onClick={() => {
                              deleteAttendance(att._id, att.employee?.name || 'Unknown Employee', att.date);
                              setShowDateModal(false); // Close modal after deletion
                            }}
                            className="delete-btn"
                            title="Delete this attendance record"
                            style={{
                              background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
                              color: 'white',
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '11px',
                              fontWeight: '600',
                              marginTop: '8px',
                              transition: 'all 0.3s ease',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            🗑️ Delete Record
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-attendance">
                    <p>No attendance records found for this date.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Expenses Component
function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [sites, setSites] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
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
      setRefreshing(true);
      const timestamp = new Date().getTime();
      // Force cache bypass with multiple parameters
      const response = await api.get(`/expenses?_t=${timestamp}&nocache=${Math.random()}`);
      setExpenses(response.data.data || []);
    } catch (err) {
      console.error('Error fetching expenses:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const fetchSites = async () => {
    try {
      const timestamp = new Date().getTime();
      const response = await api.get(`/sites?_t=${timestamp}`);
      setSites(response.data.data || []);
    } catch (err) {
      console.error('Error fetching sites:', err);
    }
  };

  const fetchEmployees = async () => {
    try {
      // Fetch all active employees without pagination limit
      const timestamp = new Date().getTime();
      const response = await api.get(`/employees?limit=1000&isActive=true&_t=${timestamp}`);
      const employeesList = response.data.data?.employees || [];
      setEmployees(employeesList);
    } catch (err) {
      console.error('Error fetching employees:', err);
      // Fallback to try without auth for public endpoints
      try {
        const publicResponse = await axios.get(`${API_URL}/employees/public/active?_t=${timestamp}`);
        setEmployees(publicResponse.data.data || []);
      } catch (publicErr) {
        console.error('Error fetching employees from public endpoint:', publicErr);
        setEmployees([]);
      }
    }
  };

  const handleEdit = (expense) => {
    setEditingId(expense._id);
    setFormData({
      site: expense.site?._id || '',
      category: expense.category,
      amount: expense.amount,
      description: expense.description || '',
      billAttachment: null,
      employee: expense.employee?._id || '',
      date: new Date(expense.date).toISOString().split('T')[0]
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await api.delete(`/expenses/${id}`);
        // Force immediate refresh with cache bypass
        await fetchExpenses();
        // Emit refresh event to update other components
        if (typeof refreshEvents !== 'undefined') {
          refreshEvents.emit('expenses');
        }
        alert('Expense deleted successfully!');
      } catch (err) {
        alert(err.response?.data?.message || 'Error deleting expense');
      }
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
        date: formData.date
      };
      
      // Only include employee if it has a value
      if (formData.employee) {
        submitData.employee = formData.employee;
      }
      
      if (editingId) {
        // Update existing expense
        await api.put(`/expenses/${editingId}`, submitData);
      } else {
        // Create new expense
        await api.post('/expenses', submitData);
      }
      
      setShowForm(false);
      setEditingId(null);
      setFormData({ site: '', category: 'Labour', amount: '', description: '', billAttachment: null, employee: '', date: new Date().toISOString().split('T')[0] });
      
      // Force immediate refresh with cache bypass
      await fetchExpenses();
      
      // Emit refresh event to update other components
      if (typeof refreshEvents !== 'undefined') {
        refreshEvents.emit('expenses');
      }
      
      alert(`Expense ${editingId ? 'updated' : 'created'} successfully!`);
    } catch (err) {
      console.error(`Error ${editingId ? 'updating' : 'creating'} expense:`, err);
      alert(err.response?.data?.message || `Error ${editingId ? 'updating' : 'creating'} expense`);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ site: '', category: 'Labour', amount: '', description: '', billAttachment: null, employee: '', date: new Date().toISOString().split('T')[0] });
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
            <option value="2026-02">February 2026</option>
            <option value="2026-01">January 2026</option>
            <option value="2025-12">December 2025</option>
            <option value="2025-11">November 2025</option>
            <option value="2025-10">October 2025</option>
            <option value="2025-09">September 2025</option>
            <option value="2025-08">August 2025</option>
            <option value="2025-07">July 2025</option>
            <option value="2025-06">June 2025</option>
            <option value="2025-05">May 2025</option>
            <option value="2025-04">April 2025</option>
            <option value="2025-03">March 2025</option>
            <option value="2025-02">February 2025</option>
            <option value="2025-01">January 2025</option>
            <option value="2026-03">March 2026</option>
            <option value="2026-04">April 2026</option>
            <option value="2026-05">May 2026</option>
            <option value="2026-06">June 2026</option>
            <option value="2026-07">July 2026</option>
            <option value="2026-08">August 2026</option>
            <option value="2026-09">September 2026</option>
            <option value="2026-10">October 2026</option>
            <option value="2026-11">November 2026</option>
            <option value="2026-12">December 2026</option>
          </select>
          <button onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'Add Expense'}
          </button>
          <button onClick={async () => {
            setRefreshing(true);
            try {
              await Promise.all([
                fetchExpenses(),
                fetchSites(),
                fetchEmployees()
              ]);
            } finally {
              setRefreshing(false);
            }
          }} style={{ background: '#28a745', marginLeft: '10px' }} disabled={refreshing}>
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
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
            onChange={(e) => {
              // Clear employee field when changing category
              setFormData({ ...formData, category: e.target.value, employee: '' });
            }}
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
            onClick={(e) => {
              // Ensure the date picker opens
              e.target.showPicker && e.target.showPicker();
            }}
            onFocus={(e) => {
              // Set z-index when focused
              e.target.style.zIndex = '1010';
            }}
            onBlur={(e) => {
              // Reset z-index when blurred
              setTimeout(() => {
                e.target.style.zIndex = '10';
              }, 200);
            }}
            style={{ position: 'relative', zIndex: 10 }}
            required
          />
          <input
            placeholder="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <button type="submit" style={{gridColumn: 'span 2'}}>
            {editingId ? 'Update Expense' : 'Create Expense'}
          </button>
          {editingId && (
            <button type="button" onClick={handleCancel} style={{gridColumn: 'span 2', background: '#6c757d'}}>
              Cancel Edit
            </button>
          )}
        </form>
      )}

      <div className="table-container">
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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.map((exp) => (
              <tr key={exp._id}>
                <td>{formatDateDDMMYYYY(exp.date)}</td>
                <td>{exp.site?.name || 'N/A'}</td>
                <td>{exp.category}</td>
                <td>{exp.employee ? `${exp.employee.name} (${exp.employee.role})` : '-'}</td>
                <td>₹{exp.amount.toLocaleString()}</td>
                <td>{exp.description || '-'}</td>
                <td>{exp.paymentStatus}</td>
                <td>
                  <button onClick={() => handleEdit(exp)} className="edit-btn" style={{marginRight: '5px'}}>Edit</button>
                  <button onClick={() => handleDelete(exp._id)} className="delete-btn">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Main App Component
// Main App Component
function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // Keep-alive functionality to prevent backend from sleeping
  useEffect(() => {
    const keepBackendAlive = async () => {
      try {
        // Ping the health endpoint to keep backend awake
        await fetch(`${API_URL.replace('/api', '')}/health`);
        console.log('Keep-alive ping sent');
      } catch (err) {
        console.log('Keep-alive ping failed:', err.message);
      }
    };

    // Ping every 10 minutes (600,000 ms)
    const keepAliveInterval = setInterval(keepBackendAlive, 10 * 60 * 1000);

    // Send initial ping after 1 minute
    const initialPing = setTimeout(keepBackendAlive, 60 * 1000);

    // Cleanup on unmount
    return () => {
      clearInterval(keepAliveInterval);
      clearTimeout(initialPing);
    };
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
            <h1>🏗️ Sahara Construction</h1>
            <div className="nav-links">
              <NavLink to="/">My Dashboard</NavLink>
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

  // Admin view - full access with sidebar
  return (
    <Router>
      <div className="app-with-sidebar">
        {/* Top Header */}
        <header className="top-header">
          <div className="header-logo">
            <span className="logo-icon">🏗️</span>
            <span className="logo-text">Sahara Construction</span>
          </div>
          <div className="header-right">
            <div className="user-info">
              <span className="user-name">{user.name}</span>
              <span className="user-role">{user.role}</span>
            </div>
            <button onClick={handleLogout} className="logout-btn-header">Logout</button>
          </div>
        </header>

        <div className="main-layout">
          {/* Sidebar Navigation */}
          <aside className="sidebar">
            <nav className="sidebar-nav">
              <NavLink to="/" end className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
                <span className="sidebar-icon">📊</span>
                <span className="sidebar-text">Dashboard</span>
              </NavLink>
              <NavLink to="/employees" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
                <span className="sidebar-icon">👥</span>
                <span className="sidebar-text">Employees</span>
              </NavLink>
              <NavLink to="/attendance" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
                <span className="sidebar-icon">📋</span>
                <span className="sidebar-text">Attendance</span>
              </NavLink>
              <NavLink to="/sites" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
                <span className="sidebar-icon">🏗️</span>
                <span className="sidebar-text">Sites</span>
              </NavLink>
              <NavLink to="/expenses" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
                <span className="sidebar-icon">💰</span>
                <span className="sidebar-text">Expenses</span>
              </NavLink>
              <NavLink to="/site-reports" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
                <span className="sidebar-icon">📊</span>
                <span className="sidebar-text">Site Reports</span>
              </NavLink>
              <NavLink to="/labour-reports" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
                <span className="sidebar-icon">👷</span>
                <span className="sidebar-text">Labour Reports</span>
              </NavLink>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Dashboard user={user} />} />
              <Route path="/employees" element={<Employees />} />
              <Route path="/sites" element={<Sites />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/site-reports" element={<SiteExpenseReport />} />
              <Route path="/labour-reports" element={<LabourReports />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;

