# Hosting and Data Persistence Guide

## Current Issues and Solutions

### 1. Frequent Redeployments Issue

**Problem**: Your site needs frequent reloading and doesn't preserve settings.

**Root Cause**: You're using **free hosting tiers** that have limitations:
- **Render (Backend)**: Free tier spins down after 15 minutes of inactivity
- **Vercel (Frontend)**: Should stay active, but may have cold starts

**Solutions**:

#### Option A: Upgrade to Paid Plans (Recommended)
- **Render**: $7/month for always-on backend
- **Vercel**: Free tier is usually sufficient for frontend

#### Option B: Keep Backend Alive (Free Solution)
Add a keep-alive service to ping your backend every 10 minutes:

```javascript
// Add to your frontend (client/src/App.jsx)
useEffect(() => {
  // Ping backend every 10 minutes to keep it alive
  const keepAlive = setInterval(async () => {
    try {
      await fetch(`${API_URL}/health`);
    } catch (err) {
      console.log('Keep-alive ping failed');
    }
  }, 10 * 60 * 1000); // 10 minutes

  return () => clearInterval(keepAlive);
}, []);
```

#### Option C: Alternative Free Hosting
- **Railway**: More generous free tier
- **Fly.io**: Better free tier limits
- **Heroku**: No longer has free tier

### 2. Data Persistence - MongoDB Atlas

**Good News**: Your data IS being saved permanently in MongoDB Atlas!

**Your Current Setup**:
✅ MongoDB Atlas (Cloud Database) - Data persists forever
✅ Proper connection with retry logic
✅ All models (Users, Employees, Sites, Attendance, Expenses) save to database

**Verification Steps**:

1. **Check MongoDB Atlas Dashboard**:
   - Go to https://cloud.mongodb.com
   - Login with your account
   - Click on your cluster
   - Go to "Browse Collections"
   - You should see all your data there

2. **Database Collections You Should See**:
   - `users` - Admin accounts
   - `employees` - Employee records
   - `sites` - Construction sites
   - `attendances` - Daily attendance records
   - `expenses` - Expense records

### 3. Settings Not Preserving

**Issue**: User login sessions expire when backend restarts.

**Solution**: Extend JWT token expiry and add refresh tokens.

Current: `JWT_EXPIRE=7d` (7 days) - This is already good!

**Additional Solutions**:

#### A. Add Remember Me Functionality
```javascript
// In login component
const [rememberMe, setRememberMe] = useState(false);

const handleLogin = async (userData) => {
  setUser(userData);
  if (rememberMe) {
    // Store in localStorage with longer expiry
    localStorage.setItem('rememberUser', 'true');
  }
};
```

#### B. Auto-refresh tokens
```javascript
// Add token refresh logic
const refreshToken = async () => {
  try {
    const response = await api.post('/auth/refresh');
    localStorage.setItem('token', response.data.token);
    return response.data.token;
  } catch (err) {
    // Redirect to login
    handleLogout();
  }
};
```

## Recommended Immediate Actions

### 1. Verify Data Persistence
1. Login to MongoDB Atlas: https://cloud.mongodb.com
2. Check your cluster: `Cluster0`
3. Browse Collections to see your data
4. Take screenshots to confirm data is there

### 2. Fix Backend Sleep Issue
Choose one:
- **Best**: Upgrade Render to $7/month paid plan
- **Free**: Add keep-alive ping (I can implement this)

### 3. Add Health Check Endpoint
```javascript
// Add to your backend routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});
```

## Data Backup Strategy

### 1. MongoDB Atlas Automatic Backups
- Atlas automatically backs up your data
- Point-in-time recovery available
- No action needed from you

### 2. Manual Export (Optional)
```bash
# Export all data
mongodump --uri="your-mongodb-atlas-uri"

# Export specific collection
mongoexport --uri="your-mongodb-atlas-uri" --collection=employees --out=employees.json
```

## Monitoring Your App

### 1. Check Backend Status
Visit: `https://your-render-app.onrender.com/api/health`

### 2. Check Database Connection
Visit: `https://your-render-app.onrender.com/api/health`
Should show: `"database": "connected"`

### 3. Monitor Logs
- **Render**: Check logs in Render dashboard
- **Vercel**: Check function logs in Vercel dashboard

## Summary

**Your Data IS Safe**: MongoDB Atlas preserves all data permanently.

**The Real Issue**: Free hosting causes backend to sleep, making app seem "broken".

**Best Solution**: Upgrade Render to $7/month for always-on backend.

**Free Alternative**: Add keep-alive ping (I can implement this now).

Would you like me to:
1. Add the keep-alive functionality?
2. Add a health check endpoint?
3. Help you verify your data in MongoDB Atlas?