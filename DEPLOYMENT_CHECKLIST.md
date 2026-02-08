# Deployment Checklist ✅

Follow these steps in order:

## Before Deployment

- [ ] MongoDB Atlas is set up and connection string is ready
- [ ] All features are tested locally
- [ ] Environment variables are documented

## Step 1: Prepare Code

- [ ] Create `.gitignore` file (already created)
- [ ] Update `.env` with MongoDB Atlas connection string
- [ ] Test app locally with Atlas database

## Step 2: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/sahara-construction.git
git push -u origin main
```

- [ ] Code is pushed to GitHub
- [ ] Repository is created

## Step 3: Deploy Backend (Render)

1. [ ] Sign up at https://render.com
2. [ ] Create new Web Service
3. [ ] Connect GitHub repository
4. [ ] Configure:
   - Name: `sahara-construction-api`
   - Build: `npm install`
   - Start: `npm start`
5. [ ] Add environment variables:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `JWT_EXPIRE=7d`
   - `NODE_ENV=production`
   - `PORT=5000`
6. [ ] Deploy and wait
7. [ ] Save backend URL: `_______________________________`
8. [ ] Test: Visit `https://your-backend.onrender.com/api/sites`

## Step 4: Update Frontend

In `client/src/App.jsx`, change:
```javascript
const API_URL = 'https://YOUR_BACKEND_URL.onrender.com/api';
```

- [ ] API_URL updated with Render backend URL
- [ ] Changes committed and pushed to GitHub

## Step 5: Deploy Frontend (Vercel)

1. [ ] Sign up at https://vercel.com
2. [ ] Import GitHub repository
3. [ ] Configure:
   - Framework: Vite
   - Root Directory: `client`
   - Build: `npm run build`
   - Output: `dist`
4. [ ] Deploy
5. [ ] Save frontend URL: `_______________________________`

## Step 6: Test Deployed App

- [ ] Visit frontend URL
- [ ] Create admin account
- [ ] Add employee
- [ ] Add site
- [ ] Mark attendance
- [ ] Add expense
- [ ] Test employee login

## Step 7: Share

- [ ] Share frontend URL with team
- [ ] Document admin credentials securely
- [ ] Set up monitoring (optional)

## Troubleshooting

If something doesn't work:
1. Check Render logs for backend errors
2. Check browser console for frontend errors
3. Verify MongoDB Atlas IP whitelist (0.0.0.0/0)
4. Verify environment variables are set correctly

## Your URLs

- Frontend: `https://_____________________________.vercel.app`
- Backend: `https://_____________________________.onrender.com`
- Database: MongoDB Atlas

---

**Estimated Time:** 30-45 minutes
**Cost:** FREE (all services have free tiers)

🎉 Once complete, your app is live and accessible from anywhere!
