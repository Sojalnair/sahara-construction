# MongoDB Atlas Setup Guide

## Quick Setup Steps

### 1. Create MongoDB Atlas Account
- Visit: https://www.mongodb.com/cloud/atlas/register
- Sign up with email or Google
- Verify your email

### 2. Create a Free Cluster
- Click "Build a Database"
- Choose **FREE** (M0 Sandbox)
- Select cloud provider: **AWS** (recommended)
- Select region: Choose closest to your location
- Cluster Name: Keep default or name it "construction-cluster"
- Click "Create"

### 3. Create Database User
- Go to **Security** → **Database Access**
- Click "Add New Database User"
- Authentication Method: **Password**
- Username: `construction_admin` (or your choice)
- Password: Generate a secure password (SAVE THIS!)
- Database User Privileges: **Read and write to any database**
- Click "Add User"

### 4. Whitelist IP Address
- Go to **Security** → **Network Access**
- Click "Add IP Address"
- Click "Allow Access from Anywhere" (0.0.0.0/0)
  - This allows connections from any IP (needed for deployment)
- Click "Confirm"

### 5. Get Connection String
- Go to **Database** → **Connect**
- Click "Connect your application"
- Driver: **Node.js**
- Version: **4.1 or later**
- Copy the connection string

Example connection string:
```
mongodb+srv://construction_admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

### 6. Update .env File

Replace the MONGODB_URI in your `.env` file:

```env
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/construction-management?retryWrites=true&w=majority
```

**Important:**
- Replace `YOUR_USERNAME` with your database username
- Replace `YOUR_PASSWORD` with your database password
- Replace `YOUR_CLUSTER` with your cluster address
- Keep `/construction-management` at the end (this is your database name)

### 7. Restart Your Backend

After updating .env:
```bash
# Stop the backend (Ctrl+C in the terminal)
# Then restart:
npm start
```

### 8. Verify Connection

Check the terminal output. You should see:
```
MongoDB Connected: cluster0-shard-00-00.xxxxx.mongodb.net
```

## View Your Data

### Option 1: MongoDB Atlas Dashboard
- Go to your cluster in Atlas
- Click "Browse Collections"
- You'll see your databases and collections

### Option 2: MongoDB Compass (Desktop App)
- Download: https://www.mongodb.com/try/download/compass
- Install and open
- Paste your connection string
- Click "Connect"

## Troubleshooting

### Connection Failed
- Check username and password are correct
- Ensure IP address is whitelisted (0.0.0.0/0)
- Check if password has special characters - they need to be URL encoded:
  - `@` → `%40`
  - `#` → `%23`
  - `$` → `%24`
  - `%` → `%25`

### Can't See Data
- Make sure you're looking at the correct database name: `construction-management`
- Data only appears after you create records in the app

## Benefits of MongoDB Atlas

✅ **Access from anywhere** - No need to be on local network
✅ **Automatic backups** - Your data is safe
✅ **Free tier** - 512MB storage (plenty for this app)
✅ **Easy deployment** - Works with Vercel, Heroku, etc.
✅ **Monitoring** - See database performance and usage

## Next Steps for Deployment

Once MongoDB Atlas is set up, you can deploy your app to:
- **Vercel** (frontend)
- **Render** or **Railway** (backend)
- **Heroku** (full stack)

Your data will be accessible from anywhere!
