const mongoose = require('mongoose');
require('dotenv').config();

// Employee model
const employeeSchema = new mongoose.Schema({
  name: String,
  phone: String,
  role: String,
  salaryType: String,
  salaryAmount: Number,
  isActive: { type: Boolean, default: true },
  totalAdvance: { type: Number, default: 0 }
}, { timestamps: true });

const Employee = mongoose.model('Employee', employeeSchema);

async function checkDatabase() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    console.log('\n📊 Checking employees in database...');
    const allEmployees = await Employee.find({});
    console.log(`Total employees in database: ${allEmployees.length}`);
    
    if (allEmployees.length > 0) {
      console.log('\n👥 Employee list:');
      allEmployees.forEach((emp, index) => {
        console.log(`${index + 1}. ${emp.name} - ${emp.phone} - ${emp.role} - ${emp.isActive ? 'Active' : 'Inactive'}`);
      });
      
      const activeCount = allEmployees.filter(emp => emp.isActive).length;
      const inactiveCount = allEmployees.filter(emp => !emp.isActive).length;
      console.log(`\n📈 Summary: ${activeCount} active, ${inactiveCount} inactive`);
    } else {
      console.log('❌ No employees found in database');
      console.log('   You need to create employees first');
    }
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkDatabase();