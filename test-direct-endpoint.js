const axios = require('axios');

async function testDirectEndpoint() {
  console.log('⏳ Waiting for backend to deploy (15 seconds)...');
  
  // Wait for deployment
  await new Promise(resolve => setTimeout(resolve, 15000));
  
  try {
    console.log('🔍 Testing direct endpoint...');
    const response = await axios.get('https://sahara-construction.onrender.com/api/employees-direct');
    console.log('✅ Direct endpoint works!');
    console.log('Response:', response.data);
    console.log('Employees found:', response.data.data?.employees?.length || 0);
    
    if (response.data.data?.employees?.length > 0) {
      console.log('\n👥 First few employees:');
      response.data.data.employees.slice(0, 3).forEach((emp, index) => {
        console.log(`${index + 1}. ${emp.name} - ${emp.phone} - ${emp.role} - ${emp.isActive ? 'Active' : 'Inactive'}`);
      });
    }
  } catch (error) {
    console.log('❌ Direct endpoint failed:', error.response?.data || error.message);
    console.log('Status:', error.response?.status);
  }
}

testDirectEndpoint();