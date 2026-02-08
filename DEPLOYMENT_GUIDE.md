# Sahara Construction - Deployment Guide

This guide will help you deploy your construction management app to the internet for FREE!

## Prerequisites

Before deploying, make sure you have:
- ✅ MongoDB Atlas set up (see MONGODB_ATLAS_SETUP.md)
- ✅ GitHub account
- ✅ Your code pushed to GitHub

## Deployment Architecture

- **Backend (API)**: Render.com (Free tier)
- **Frontend (React)**: Vercel.com (Free tier)
- **Database**: MongoDB Atlas (Free tier)

---

## Part 1: Push Code to GitHub

### 1. Create a GitHub Repository

1. Go to https://github.com/new
2. Repository name: `sahara-construction`
3. Make it **Private** (recommended)
4. Don't initialize with README (you already have one)
5. Click "Create repository"

### 2. Push Your Code

Open terminal in your project folder and run:

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Sahara Construction App"

# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/sahara-construction.git

# Push to GitHub
git branch -M main
git push -u origin main
```

---

## Part 2: Deploy Backend to Render

### 1. Sign Up for Render

1. Go to https://render.com/
2. Click "Get Started for Free"
3. Sign up with GitHub (recommended)

### 2. Create New Web Service

1. Click "New +" → "Web Service"
2. Connect your GitHub repository: `sahara-construction`
3. Configure the service:

**Basic Settings:**
- Name: `sahara-construction-api`
- Region: Choose closest to you
- Branch: `main`
- Root Directory: Leave empty (backend is in root)
- Runtime: `Node`
- Build Command: `npm install`
- Start Command: `npm start`

**Plan:**
- Select **Free** plan

### 3. Add Environment Variables

Click "Advanced" → "Add Environment Variable" and add these:

```
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=construction-management-super-secret-key-for-jwt-tokens-minimum-32-chars
JWT_EXPIRE=7d
PORT=5000
NODE_ENV=production
```

**Important:** Replace `your_mongodb_atlas_connection_string` with your actual MongoDB Atlas connection string!

### 4. Deploy

1. Click "Create Web Service"
2. Wait 5-10 minutes for deployment
3. Once deployed, you'll get a URL like: `https://sahara-construction-api.onrender.com`
4. **Save this URL** - you'll need it for the frontend!

### 5. Test Backend

Visit: `https://your-backend-url.onrender.com/api/sites`

You should see: `{"success":true,"data":[]}`

---

## Part 3: Deploy Frontend to Vercel

### 1. Update Frontend API URL

Before deploying frontend, update the API URL to point to your deployed backend.

In `client/src/App.jsx`, change:
```javascript
const API_URL = 'http://localhost:5000/api';
```

To:
```javascript
const API_URL = 'https://your-backend-url.onrender.com/api';
```

Replace `your-backend-url` with your actual Render backend URL!

Commit and push this change:
```bash
git add client/src/App.jsx
git commit -m "Update API URL for production"
git push
```

### 2. Sign Up for Vercel

1. Go to https://vercel.com/signup
2. Sign up with GitHub (recommended)
3. Authorize Vercel to access your repositories

### 3. Deploy Frontend

1. Click "Add New..." → "Project"
2. Import your repository: `sahara-construction`
3. Configure project:

**Framework Preset:** Vite
**Root Directory:** `client`
**Build Command:** `npm run build`
**Output Directory:** `dist`

4. Click "Deploy"
5. Wait 2-3 minutes
6. You'll get a URL like: `https://sahara-construction.vercel.app`

---

## Part 4: Enable CORS on Backend

Your backend needs to allow requests from your Vercel frontend.

### Update server.js

Add this CORS configuration in `server.js`:

```javascript
const cors = require('cors');

// Add after creating express app
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://your-vercel-url.vercel.app'
  ],
  credentials: true
}));
```

Replace `your-vercel-url` with your actual Vercel URL!

Commit and push:
```bash
git add server.js
git commit -m "Add CORS for production"
git push
```

Render will automatically redeploy your backend.

---

## Part 5: Test Your Deployed App

1. Visit your Vercel URL: `https://your-app.vercel.app`
2. Create an admin account
3. Test all features:
   - ✅ Login
   - ✅ Add employees
   - ✅ Add sites
   - ✅ Mark attendance
   - ✅ Add expenses

---

## Your Deployed URLs

After deployment, you'll have:

- **Frontend**: `https://sahara-construction.vercel.app`
- **Backend**: `https://sahara-construction-api.onrender.com`
- **Database**: MongoDB Atlas (cloud)

Share the frontend URL with your team!

---

## Important Notes

### Free Tier Limitations

**Render (Backend):**
- Spins down after 15 minutes of inactivity
- First request after inactivity takes 30-60 seconds (cold start)
- 750 hours/month free

**Vercel (Frontend):**
- Always fast and available
- 100GB bandwidth/month
- Unlimited deployments

**MongoDB Atlas:**
- 512MB storage
- Shared cluster
- Perfect for this app

### Keeping Backend Awake

To prevent cold starts, you can:
1. Use a service like UptimeRobot to ping your backend every 10 minutes
2. Upgrade to Render paid plan ($7/month) for always-on

---

## Updating Your App

Whenever you make changes:

```bash
# Make your changes
git add .
git commit -m "Description of changes"
git push
```

- **Vercel**: Auto-deploys on every push (2-3 minutes)
- **Render**: Auto-deploys on every push (5-10 minutes)

---

## Troubleshooting

### Backend not responding
- Check Render logs: Dashboard → Your Service → Logs
- Verify MongoDB Atlas connection string
- Check environment variables are set correctly

### Frontend can't connect to backend
- Verify API_URL in App.jsx points to Render URL
- Check CORS is configured correctly
- Check backend is running (visit backend URL)

### Database connection failed
- Verify MongoDB Atlas IP whitelist includes 0.0.0.0/0
- Check connection string has correct username/password
- Ensure database user has read/write permissions

---

## Security Recommendations

1. **Change JWT_SECRET** to a strong random string
2. **Use environment variables** for all sensitive data
3. **Enable 2FA** on GitHub, Vercel, and Render accounts
4. **Regular backups** - MongoDB Atlas does this automatically
5. **Monitor usage** - Check Render and Vercel dashboards regularly

---

## Cost Breakdown

- MongoDB Atlas: **FREE** (512MB)
- Render Backend: **FREE** (with cold starts)
- Vercel Frontend: **FREE** (100GB bandwidth)

**Total: $0/month** 🎉

To upgrade for better performance:
- Render Starter: $7/month (no cold starts)
- MongoDB Atlas M2: $9/month (2GB storage)

---

## Support

If you encounter issues:
1. Check the logs in Render dashboard
2. Check browser console for frontend errors
3. Verify all environment variables are set
4. Test backend API endpoints directly

Your app is now live and accessible from anywhere! 🚀
