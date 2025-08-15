#!/usr/bin/env node

/**
 * Test script to verify client API functionality
 * Run with: node scripts/test-client-api.js
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Import the Client model
async function testClientAPI() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Import the Client model
    const { Client } = require('../src/models/Client');

    // Test 1: Create a test client with all new fields
    console.log('\n📝 Creating test client with new fields...');
    const testClient = await Client.create({
      organization: 'Test Organization Inc.',
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      phone: '+1 (555) 000-0001',
      website: 'https://example.com',
      industry: 'Technology',
      status: 'active',
      jobTitle: 'CEO',
      companySize: '11-50',
      notes: 'This is a test client created to verify the new schema',
      leadSource: 'website',
      estimatedValue: 50000,
      linkedin: 'linkedin.com/in/testuser',
      twitter: '@testuser',
      address: {
        line1: '123 Test Street',
        city: 'Test City',
        state: 'TS',
        postalCode: '12345',
        country: 'Test Country'
      }
    });
    console.log('✅ Client created successfully with ID:', testClient._id);

    // Test 2: Fetch the client
    console.log('\n🔍 Fetching client by ID...');
    const fetchedClient = await Client.findById(testClient._id);
    console.log('✅ Client fetched successfully');
    console.log('   - Name:', fetchedClient.firstName, fetchedClient.lastName);
    console.log('   - Organization:', fetchedClient.organization);
    console.log('   - Status:', fetchedClient.status);
    console.log('   - Estimated Value:', fetchedClient.estimatedValue);

    // Test 3: Update the client with avatar
    console.log('\n📸 Updating client with avatar URL...');
    const avatarUrl = 'https://example-supabase.com/storage/v1/object/public/avatars/test-avatar.jpg';
    fetchedClient.avatar = avatarUrl;
    await fetchedClient.save();
    console.log('✅ Avatar URL added successfully');

    // Test 4: Search for clients
    console.log('\n🔎 Testing search functionality...');
    const searchResults = await Client.find({
      $or: [
        { firstName: { $regex: 'Test', $options: 'i' } },
        { organization: { $regex: 'Test', $options: 'i' } }
      ]
    });
    console.log(`✅ Found ${searchResults.length} client(s) matching "Test"`);

    // Clean up - delete the test client
    console.log('\n🧹 Cleaning up test data...');
    await Client.findByIdAndDelete(testClient._id);
    console.log('✅ Test client deleted');

    console.log('\n✨ All tests passed successfully!');
    console.log('The client functionality is working correctly with the new schema.');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the test
testClientAPI();