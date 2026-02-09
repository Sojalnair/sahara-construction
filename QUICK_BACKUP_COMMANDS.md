# Quick Backup Commands

## 🚀 One-Command Backup

### **Backup All Data Now:**
```bash
node scripts/backup-data.js
```

**Output:** Creates `backups/backup-YYYY-MM-DD-HH-mm-ss/` folder with all your data

---

## 📊 Access Your Data Directly

### **Method 1: MongoDB Atlas Dashboard (Easiest)**
1. Go to: https://cloud.mongodb.com
2. Login with your account
3. Click "Browse Collections"
4. View/Export any data

### **Method 2: Export from App**
- Go to any report page
- Click "Export CSV" button
- Downloads current data

---

## 🔄 Where Your Data Lives

```
MongoDB Atlas (Cloud)
    ↓
Your App (Interface)
    ↓
Users See Data
```

**If app crashes:** Data is still in MongoDB Atlas ✅

---

## 💾 Backup Schedule Recommendation

### **Daily (Automatic):**
- MongoDB Atlas auto-backup (if enabled)

### **Weekly (Manual):**
```bash
node scripts/backup-data.js
```

### **Before Updates:**
```bash
node scripts/backup-data.js
```

---

## 🆘 Emergency Data Access

**If app is down, access data here:**

1. **MongoDB Atlas Dashboard**
   - https://cloud.mongodb.com
   - Login → Browse Collections
   - Export any collection

2. **Backup Files**
   - Location: `project-root/backups/`
   - Format: JSON files
   - Can be imported back anytime

3. **MongoDB Compass (Desktop App)**
   - Download: https://www.mongodb.com/products/compass
   - Connect with your connection string
   - Browse/Export data

---

## ✅ Your Data is Safe Because:

1. ✅ Stored in **MongoDB Atlas** (not in the app)
2. ✅ Cloud-based (accessible 24/7)
3. ✅ Separate from app code
4. ✅ Can be backed up anytime
5. ✅ Multiple access methods

**Bottom Line:** Even if the app crashes completely, your data is safe in MongoDB Atlas!
