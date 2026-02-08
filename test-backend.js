const axios = require('axios');

// Test backend connectivity and employee endpoints
async function testBackend() {
  const API_URL = 'https://sahara-construction.onrender.com/api';
  
  console.log('🔍 Testing backend connectivity...\n');
  
  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${API_URL}/health`);
    console.log('✅ Health check:', healthResponse.data);
    
    // Test 2: Public active employees
    console.log('\n2. Testing public active employees endpoint...');
    try {
      const activeResponse = await axios.get(`${API_URL}/employees/public/active`);
      console.log('✅ Public active employees:', activeResponse.data);
      console.log('   Count:', activeResponse.data.data?.length || 0);
    } catch (err) {
      console.log('❌ Public active employees failed:', err.response?.data || err.message);
    }
    
    // Test 3: Public all employees
    console.log('\n3. Testing public all employees endpoint...');
    try {
      const allResponse = await axios.get(`${API_URL}/employees/public/all`);
      console.log('✅ Public all employees:', allResponse.data);
      console.log('   Count:', allResponse.data.data?.employees?.length || 0);
    } catch (err) {
      console.log('❌ Public all employees failed:', err.response?.data || err.message);
    }
    
    // Test 4: Try authenticated endpoint (will likely fail without token)
    console.log('\n4. Testing authenticated employees endpoint...');
    try {
      const authResponse = await axios.get(`${API_URL}/employees?limit=1000`);
      console.log('✅ Authenticated employees:', authResponse.data);
    } catch (err) {
      console.log('❌ Authenticated employees failed (expected):', err.response?.status, err.response?.data?.message);
    }
    
  } catch (error) {
    console.log('❌ Backend connection failed:', error.message);
    console.log('   This suggests the backend server is down or unreachable');
  }
}

// Run the test
testBackend().catch(console.error);