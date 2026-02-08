/**
 * Data Backup Script
 * Creates JSON backups of all your data
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Employee = require('../models/Employee');
const Site = require('../models/Site');
const Attendance = require('../models/Attendance');
const Expense = require('../models/Expense');

async function backupData() {
  try {
    // Connect to database
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas\n');

    // Create backup directory
    const backupDir = path.join(__dirname, '../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `backup-${timestamp}`);
    fs.mkdirSync(backupPath);

    // Collections to backup
    const collections = [
      { name: 'users', model: User },
      { name: 'employees', model: Employee },
      { name: 'sites', model: Site },
      { name: 'attendance', model: Attendance },
      { name: 'expenses', model: Expense }
    ];

    console.log('💾 CREATING BACKUP');
    console.log('=' .repeat(50));

    let totalRecords = 0;

    for (const collection of collections) {
      try {
        console.log(`Backing up ${collection.name}...`);
        const data = await collection.model.find().lean();
        
        const filePath = path.join(backupPath, `${collection.name}.json`);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        
        console.log(`✅ ${collection.name}: ${data.length} records saved`);
        totalRecords += data.length;
        
      } catch (err) {
        console.log(`❌ ${collection.name}: Error - ${err.message}`);
      }
    }

    // Create backup summary
    const summary = {
      timestamp: new Date().toISOString(),
      totalRecords,
      collections: collections.map(c => c.name),
      backupPath
    };

    fs.writeFileSync(
      path.join(backupPath, 'backup-summary.json'), 
      JSON.stringify(summary, null, 2)
    );

    console.log('\n📋 BACKUP SUMMARY');
    console.log('=' .repeat(50));
    console.log(`Total Records: ${totalRecords}`);
    console.log(`Backup Location: ${backupPath}`);
    console.log(`Timestamp: ${summary.timestamp}`);
    
    console.log('\n✅ Backup completed successfully!');
    console.log(`📁 Files saved to: ${backupPath}`);
    
  } catch (error) {
    console.error('❌ Error creating backup:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run backup
backupData();