# Data Safety & Backup Guide

## 🛡️ Where Your Data is Stored

### **MongoDB Atlas (Cloud Database)**
- **Location**: MongoDB's secure cloud servers
- **Safety**: Your data is stored separately from the app
- **Persistence**: Even if the app crashes, your data remains safe
- **Access**: Available 24/7 from anywhere

### **What This Means:**
✅ **App crashes** → Data is SAFE (stored in MongoDB Atlas)
✅ **Server restarts** → Data is SAFE (stored in MongoDB Atlas)
✅ **Code updates** → Data is SAFE (stored in MongoDB Atlas)
✅ **Vercel/Render issues** → Data is SAFE (stored in MongoDB Atlas)

---

## 📍 How to Access Your Data

### **Method 1: MongoDB Atlas Dashboard (Easiest)**

1. **Login to MongoDB Atlas**
   - Go to: https://cloud.mongodb.com
   - Login with your credentials

2. **Navigate to Your Database**
   - Click "Browse Collections"
   - Select your database (e.g., `sahara-construction`)

3. **View Your Data**
   - Click on any collection:
     - `users` - Admin accounts
     - `employees` - Employee records
     - `sites` - Construction sites
     - `attendance` - Attendance records
     - `expenses` - Expense records
     - `credentials` - Biometric data (if enabled)

4. **Export Data**
   - Click "Export Collection"
   - Choose format: JSON or CSV
   - Download to your computer

---

## 💾 Automated Backup Solutions

### **Option 1: MongoDB Atlas Automatic Backups (Recommended)**

MongoDB Atlas provides automatic backups:

1. **Go to MongoDB Atlas Dashboard**
2. **Click on your cluster**
3. **Go to "Backup" tab**
4. **Enable "Cloud Backup"**

**Features:**
- ✅ Automatic daily backups
- ✅ Point-in-time recovery
- ✅ Restore to any point in last 7 days
- ✅ No manual work required

**Cost:** Free tier includes basic backups

---

### **Option 2: Manual Backup Script (Free)**

I've created backup scripts in your project:

#### **Backup Your Data:**
```bash
node scripts/backup-data.js
```

**What it does:**
- Exports all collections to JSON files
- Saves to `backups/backup-YYYY-MM-DD-HH-mm-ss/`
- Creates separate files for each collection

#### **Verify Backup:**
```bash
node scripts/verify-data.js
```

**What it does:**
- Checks backup files exist
- Counts records in each collection
- Verifies data integrity

---

### **Option 3: Scheduled Backups (Advanced)**

Set up automatic backups using cron jobs or task scheduler:

#### **Windows Task Scheduler:**
1. Open Task Scheduler
2. Create Basic Task
3. Set trigger: Daily at 2 AM
4. Action: Run `node scripts/backup-data.js`

#### **Linux/Mac Cron:**
```bash
# Edit crontab
crontab -e

# Add this line (runs daily at 2 AM)
0 2 * * * cd /path/to/project && node scripts/backup-data.js
```

---

## 🔄 How to Restore Data

### **If App Crashes but Database is Fine:**
1. Just redeploy the app
2. Data will automatically reconnect
3. Everything works as before

### **If Database Data is Lost (Rare):**

#### **From MongoDB Atlas Backup:**
1. Go to MongoDB Atlas Dashboard
2. Click "Backup" tab
3. Select restore point
4. Click "Restore"
5. Choose restore location

#### **From Manual Backup:**
1. Use MongoDB Compass or mongorestore command
2. Connect to your database
3. Import JSON files from backup folder

**Command:**
```bash
mongorestore --uri="your-mongodb-connection-string" --dir=./backups/backup-YYYY-MM-DD/
```

---

## 📊 Data Export Options

### **Export All Data (CSV Format):**

#### **1. From MongoDB Atlas:**
- Browse Collections → Select collection → Export → CSV

#### **2. From Your App:**
- Each report page has "Export CSV" button
- Exports current view to CSV file

#### **3. Using MongoDB Compass:**
- Download: https://www.mongodb.com/products/compass
- Connect to your database
- Select collection → Export → CSV/JSON

---

## 🔐 Connection String Safety

Your MongoDB connection string is stored in:
- **Backend**: `.env` file (not in git)
- **Render**: Environment variables (secure)

**To view your connection string:**
1. Go to MongoDB Atlas
2. Click "Connect"
3. Choose "Connect your application"
4. Copy connection string

**Keep this safe!** Anyone with this string can access your database.

---

## 📱 Emergency Data Access

### **If Everything is Down:**

1. **MongoDB Atlas Dashboard**
   - Login: https://cloud.mongodb.com
   - View all data directly
   - Export any collection

2. **MongoDB Compass (Desktop App)**
   - Download: https://www.mongodb.com/products/compass
   - Connect using connection string
   - Browse and export data

3. **Command Line (mongosh)**
   ```bash
   mongosh "your-connection-string"
   use sahara-construction
   db.employees.find()
   db.expenses.find()
   ```

---

## 🎯 Best Practices

### **Daily:**
- ✅ App automatically saves to MongoDB Atlas
- ✅ No action needed

### **Weekly:**
- ✅ Run manual backup: `node scripts/backup-data.js`
- ✅ Store backup files in safe location (Google Drive, Dropbox)

### **Monthly:**
- ✅ Verify backups work: `node scripts/verify-data.js`
- ✅ Test restore process
- ✅ Clean up old backup files

### **Before Major Changes:**
- ✅ Create manual backup
- ✅ Export important data to CSV
- ✅ Keep backup until changes are verified

---

## 🆘 Emergency Recovery Steps

### **Scenario 1: App Won't Load**
1. Check Vercel/Render status
2. Data is safe in MongoDB Atlas
3. Redeploy app
4. Data reconnects automatically

### **Scenario 2: Database Connection Lost**
1. Check MongoDB Atlas status
2. Verify connection string in Render
3. Restart backend service
4. Data is still there

### **Scenario 3: Accidental Data Deletion**
1. Stop using the app immediately
2. Go to MongoDB Atlas → Backup
3. Restore from last backup point
4. Or use manual backup files

### **Scenario 4: Complete System Failure**
1. Your data is in MongoDB Atlas (separate from app)
2. Login to MongoDB Atlas dashboard
3. Export all collections
4. Rebuild app and import data

---

## 📞 Support Resources

### **MongoDB Atlas Support:**
- Documentation: https://docs.atlas.mongodb.com
- Support: https://support.mongodb.com

### **Your Backup Files Location:**
```
project-root/
  └── backups/
      ├── backup-2026-02-08-14-30-00/
      │   ├── employees.json
      │   ├── sites.json
      │   ├── attendance.json
      │   └── expenses.json
      └── backup-2026-02-07-14-30-00/
          └── ...
```

---

## ✅ Summary

**Your data is SAFE because:**
1. ✅ Stored in MongoDB Atlas (cloud database)
2. ✅ Separate from the app code
3. ✅ Accessible even if app crashes
4. ✅ Can be backed up manually or automatically
5. ✅ Can be exported anytime to CSV/JSON
6. ✅ Multiple recovery options available

**Remember:** The app is just the interface. Your actual data lives safely in MongoDB Atlas!
