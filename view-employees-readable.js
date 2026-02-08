const mongoose = require('mongoose');
require('dotenv').config();

// Site model (needed for population)
const siteSchema = new mongoose.Schema({
  name: String,
  location: String,
  status: String
}, { timestamps: true });

const Site = mongoose.model('Site', siteSchema);

// Employee model
const employeeSchema = new mongoose.Schema({
  name: String,
  phone: String,
  role: String,
  salaryType: String,
  salaryAmount: Number,
  isActive: { type: Boolean, default: true },
  totalAdvance: { type: Number, default: 0 },
  currentSite: { type: mongoose.Schema.Types.ObjectId, ref: 'Site' }
}, { timestamps: true });

const Employee = mongoose.model('Employee', employeeSchema);

async function viewEmployeesReadable() {
  try {
    console.log('🔍 Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');
    
    console.log('\n📊 Fetching all employees with readable format...');
    
    // Get all employees with populated site data
    const employees = await Employee.find({})
      .populate('currentSite', 'name location')
      .sort({ createdAt: -1 });
    
    console.log(`\n👥 Found ${employees.length} employees:\n`);
    console.log('=' .repeat(80));
    console.log('| ID | Name | Phone | Role | Salary | Type | Site | Status |');
    console.log('=' .repeat(80));
    
    employees.forEach((emp, index) => {
      const id = (index + 1).toString().padEnd(2);
      const name = (emp.name || 'N/A').padEnd(15);
      const phone = (emp.phone || 'N/A').padEnd(12);
      const role = (emp.role || 'N/A').padEnd(10);
      const salary = `₹${emp.salaryAmount || 0}`.padEnd(8);
      const type = (emp.salaryType || 'N/A').padEnd(7);
      const site = (emp.currentSite?.name || 'None').padEnd(10);
      const status = emp.isActive ? 'Active' : 'Inactive';
      
      console.log(`| ${id} | ${name} | ${phone} | ${role} | ${salary} | ${type} | ${site} | ${status} |`);
    });
    
    console.log('=' .repeat(80));
    
    // Summary
    const activeCount = employees.filter(emp => emp.isActive).length;
    const inactiveCount = employees.filter(emp => !emp.isActive).length;
    const totalSalary = employees.reduce((sum, emp) => sum + (emp.salaryAmount || 0), 0);
    
    console.log(`\n📈 Summary:`);
    console.log(`   Total Employees: ${employees.length}`);
    console.log(`   Active: ${activeCount}`);
    console.log(`   Inactive: ${inactiveCount}`);
    console.log(`   Total Salary Budget: ₹${totalSalary.toLocaleString()}`);
    
    // Show raw data for first employee to check for any encoding issues
    if (employees.length > 0) {
      console.log(`\n🔍 Raw data for first employee (to check encoding):`);
      console.log(JSON.stringify(employees[0].toObject(), null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

viewEmployeesReadable();