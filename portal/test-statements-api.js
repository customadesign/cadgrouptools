// Test script to verify the statements API endpoint
// Run this with: node test-statements-api.js

const BASE_URL = 'https://cadgrouptools.onrender.com';

async function testStatementsAPI() {
  console.log('Testing Statements API...\n');

  try {
    // Test 1: Check if the API endpoint is accessible
    console.log('1. Testing API endpoint accessibility...');
    const response = await fetch(`${BASE_URL}/api/statements?limit=5`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API endpoint accessible');
      console.log('Response status:', response.status);
      console.log('Response data:', JSON.stringify(data, null, 2));
      
      if (data.success && data.data) {
        console.log(`\n📊 Found ${data.data.length} statements`);
        if (data.data.length > 0) {
          console.log('Sample statement:', JSON.stringify(data.data[0], null, 2));
        }
      } else {
        console.log('❌ API returned success: false or no data');
      }
    } else {
      console.log('❌ API endpoint failed');
      console.log('Status:', response.status);
      console.log('Status text:', response.statusText);
      
      if (response.status === 401) {
        console.log('🔒 Authentication required - this is expected for protected endpoints');
      }
    }
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
  }

  console.log('\n2. Testing health endpoint...');
  try {
    const healthResponse = await fetch(`${BASE_URL}/api/health`);
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Health endpoint working:', healthData);
    } else {
      console.log('❌ Health endpoint failed:', healthResponse.status);
    }
  } catch (error) {
    console.error('❌ Error testing health endpoint:', error.message);
  }
}

// Run the test
testStatementsAPI();



