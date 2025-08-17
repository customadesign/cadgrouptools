#!/usr/bin/env node

/**
 * Test script for Google Vision API configuration
 * Usage: node scripts/test-vision-api.js
 * 
 * This script tests if your Google Vision API credentials are properly configured
 * without needing to run the full application.
 */

const https = require('https');

// Read environment variables
const API_KEY = process.env.GOOGLE_VISION_API_KEY;
const PROJECT_ID = process.env.GOOGLE_PROJECT_ID;
const SERVICE_ACCOUNT = process.env.GOOGLE_APPLICATION_CREDENTIALS;

console.log('Google Vision API Configuration Test');
console.log('=====================================\n');

// Check which authentication method is configured
if (API_KEY) {
  console.log('✅ API Key authentication detected');
  console.log(`   API Key: ${API_KEY.substring(0, 10)}...${API_KEY.substring(API_KEY.length - 4)}`);
  if (PROJECT_ID) {
    console.log(`   Project ID: ${PROJECT_ID}`);
  }
  testAPIKey(API_KEY);
} else if (SERVICE_ACCOUNT) {
  console.log('✅ Service Account authentication detected');
  if (SERVICE_ACCOUNT.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(SERVICE_ACCOUNT);
      console.log(`   Service Account Type: ${parsed.type}`);
      console.log(`   Project ID: ${parsed.project_id}`);
      console.log(`   Client Email: ${parsed.client_email}`);
      console.log('\n⚠️  Note: This script only tests API Key authentication.');
      console.log('   Service Account authentication will be tested when running the application.');
    } catch (e) {
      console.log('❌ Failed to parse SERVICE_ACCOUNT JSON:', e.message);
    }
  } else {
    console.log(`   Service Account File: ${SERVICE_ACCOUNT}`);
    console.log('\n⚠️  Note: File-based authentication works for local development.');
    console.log('   For Render deployment, you need to paste the JSON content directly.');
  }
} else {
  console.log('❌ No Google Vision API credentials found!');
  console.log('\nPlease set one of the following:');
  console.log('1. GOOGLE_VISION_API_KEY - For API Key authentication');
  console.log('2. GOOGLE_APPLICATION_CREDENTIALS - For Service Account authentication');
  console.log('\nExample:');
  console.log('  export GOOGLE_VISION_API_KEY="your-api-key-here"');
  console.log('  export GOOGLE_PROJECT_ID="your-project-id"');
  process.exit(1);
}

function testAPIKey(apiKey) {
  console.log('\nTesting API Key with Vision API...\n');
  
  // Create a simple test request with a small test image
  const testImage = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
  
  const requestBody = JSON.stringify({
    requests: [{
      image: {
        content: testImage.toString('base64')
      },
      features: [{
        type: 'LABEL_DETECTION',
        maxResults: 1
      }]
    }]
  });

  const options = {
    hostname: 'vision.googleapis.com',
    path: `/v1/images:annotate?key=${apiKey}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': requestBody.length
    }
  };

  const req = https.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        
        if (res.statusCode === 200) {
          console.log('✅ API Key is valid and Vision API is accessible!');
          console.log('\nYour Google Vision API is properly configured.');
          console.log('You can now use OCR features in your application.');
        } else if (response.error) {
          console.log(`❌ API Error (${res.statusCode}): ${response.error.message}`);
          
          if (response.error.message.includes('API key not valid')) {
            console.log('\nPossible solutions:');
            console.log('1. Check if the API key is correct');
            console.log('2. Ensure Cloud Vision API is enabled in Google Cloud Console');
            console.log('3. Check API key restrictions (IP, referrer, etc.)');
          } else if (response.error.message.includes('billing')) {
            console.log('\nBilling is not enabled for your Google Cloud project.');
            console.log('Enable billing at: https://console.cloud.google.com/billing');
          }
        }
      } catch (e) {
        console.log('❌ Failed to parse API response:', e.message);
        console.log('Raw response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.log('❌ Network error:', error.message);
    console.log('\nPlease check your internet connection.');
  });

  req.write(requestBody);
  req.end();
}

// Allow running from command line
if (require.main === module) {
  // Exit after 10 seconds if API doesn't respond
  setTimeout(() => {
    console.log('\n⏱️  Test timed out after 10 seconds');
    process.exit(1);
  }, 10000);
}