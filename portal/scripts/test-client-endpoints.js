#!/usr/bin/env node

/**
 * Test script to verify client API endpoints
 * Run with: PORT=3001 npm run dev (in one terminal)
 * Then run: node scripts/test-client-endpoints.js (in another terminal)
 */

const API_URL = 'http://localhost:3000/api';

// Test data
const testClient = {
  organization: 'Test Corp Solutions',
  firstName: 'John',
  lastName: 'TestUser',
  email: 'john.test@testcorp.com',
  phone: '+1 (555) 999-8888',
  website: 'https://testcorp.com',
  industry: 'Technology',
  status: 'active',
  jobTitle: 'Test Manager',
  companySize: '11-50',
  notes: 'This is a test client for API verification',
  leadSource: 'website',
  estimatedValue: 75000,
  linkedin: 'linkedin.com/in/johntestuser',
  twitter: '@johntestuser',
  address: {
    line1: '456 Test Boulevard',
    city: 'Testville',
    state: 'TX',
    postalCode: '78901',
    country: 'United States'
  }
};

async function testEndpoints() {
  try {
    console.log('🚀 Starting Client API Endpoint Tests\n');
    console.log('ℹ️  Make sure the dev server is running on port 3000\n');

    // Test 1: GET all clients
    console.log('📋 Test 1: Fetching all clients...');
    const getResponse = await fetch(`${API_URL}/clients`);
    if (getResponse.ok) {
      const data = await getResponse.json();
      console.log(`✅ Success! Found ${data.clients?.length || 0} clients`);
    } else {
      console.log(`❌ Failed with status: ${getResponse.status}`);
    }

    // Test 2: CREATE a new client
    console.log('\n📝 Test 2: Creating a new test client...');
    const createResponse = await fetch(`${API_URL}/clients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testClient),
    });

    let createdClientId = null;
    if (createResponse.ok) {
      const data = await createResponse.json();
      createdClientId = data.client?._id;
      console.log(`✅ Success! Created client with ID: ${createdClientId}`);
      console.log('   Client details:');
      console.log(`   - Name: ${data.client.firstName} ${data.client.lastName}`);
      console.log(`   - Organization: ${data.client.organization}`);
      console.log(`   - Status: ${data.client.status}`);
      console.log(`   - Avatar: ${data.client.avatar || 'No avatar set'}`);
    } else {
      const error = await createResponse.text();
      console.log(`❌ Failed with status: ${createResponse.status}`);
      console.log(`   Error: ${error}`);
      return;
    }

    // Test 3: GET client by ID
    if (createdClientId) {
      console.log('\n🔍 Test 3: Fetching client by ID...');
      const getByIdResponse = await fetch(`${API_URL}/clients/${createdClientId}`);
      if (getByIdResponse.ok) {
        const data = await getByIdResponse.json();
        console.log('✅ Success! Retrieved client:');
        console.log(`   - Organization: ${data.client.organization}`);
        console.log(`   - Email: ${data.client.email}`);
        console.log(`   - Estimated Value: $${data.client.estimatedValue}`);
      } else {
        console.log(`❌ Failed with status: ${getByIdResponse.status}`);
      }

      // Test 4: UPDATE client
      console.log('\n📸 Test 4: Updating client with new data...');
      const updateData = {
        notes: 'Updated notes - test successful!',
        estimatedValue: 100000,
        status: 'prospect',
      };
      
      const updateResponse = await fetch(`${API_URL}/clients/${createdClientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (updateResponse.ok) {
        const data = await updateResponse.json();
        console.log('✅ Success! Updated client:');
        console.log(`   - Notes: ${data.client.notes}`);
        console.log(`   - Estimated Value: $${data.client.estimatedValue}`);
        console.log(`   - Status: ${data.client.status}`);
      } else {
        console.log(`❌ Failed with status: ${updateResponse.status}`);
      }

      // Test 5: DELETE client (cleanup)
      console.log('\n🧹 Test 5: Deleting test client...');
      const deleteResponse = await fetch(`${API_URL}/clients/${createdClientId}`, {
        method: 'DELETE',
      });

      if (deleteResponse.ok) {
        console.log('✅ Success! Test client deleted');
      } else {
        console.log(`❌ Failed with status: ${deleteResponse.status}`);
        console.log('⚠️  You may need to manually delete the test client');
      }
    }

    console.log('\n✨ All tests completed!');
    console.log('Check the results above to verify the client API is working correctly.');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\nMake sure:');
    console.error('1. The dev server is running (npm run dev)');
    console.error('2. The server is accessible at http://localhost:3000');
    console.error('3. MongoDB is connected and accessible');
  }
}

// Run the tests
testEndpoints();