/**
 * Data Verification Script
 * Run this to check what data exists in your MongoDB Atlas database
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Employee = require('../models/Employee');
const Site = require('../models/Site');
const Attendance = require('../models/Attendance');
const Expense = require('../models/Expense');

async function verifyData() {
  try {
    // Connect to database
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas\n');

    // Check each collection
    const collections = [
      { name: 'Users', model: User },
      { name: 'Employees', model: Employee },
      { name: 'Sites', model: Site },
      { name: 'Attendance', model: Attendance },
      { name: 'Expenses', model: Expense }
    ];

    console.log('📊 DATA VERIFICATION REPORT');
    console.log('=' .repeat(50));

    for (const collection of collections) {
      try {
        const count = await collection.model.countDocuments();
        console.log(`${collection.name.padEnd(12)}: ${count} records`);
        
        if (count > 0) {
          // Show sample data
          const sample = await collection.model.findOne().lean();
          console.log(`  Sample: ${JSON.stringify(sample, null, 2).substring(0, 100)}...`);
        }
        console.log('');
      } catch (err) {
        console.log(`${collection.name.padEnd(12)}: ❌ Error - ${err.message}`);
      }
    }

    // Database info
    const dbStats = await mongoose.connection.db.stats();
    console.log('📈 DATABASE STATISTICS');
    console.log('=' .repeat(50));
    console.log(`Database Name: ${mongoose.connection.name}`);
    console.log(`Collections: ${dbStats.collections}`);
    console.log(`Data Size: ${(dbStats.dataSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Storage Size: ${(dbStats.storageSize / 1024 / 1024).toFixed(2)} MB`);

    console.log('\n✅ Data verification completed successfully!');
    
  } catch (error) {
    console.error('❌ Error verifying data:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run verification
verifyData();