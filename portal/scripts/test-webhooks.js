#!/usr/bin/env node

/**
 * Script to test webhook endpoints
 */

const axios = require('axios');

const WEBHOOK_BASE_URL = process.env.NEXTAUTH_URL || 'https://cadgrouptools.onrender.com';

async function testWebhookEndpoint(name, url) {
  console.log(`\n🧪 Testing ${name} webhook...`);
  console.log(`   URL: ${url}`);
  
  try {
    const response = await axios.get(url);
    console.log('   Status:', response.status);
    console.log('   Response:', response.data);
  } catch (error) {
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Response:', error.response.data);
      
      // 405 Method Not Allowed is expected for GET on POST-only webhooks
      if (error.response.status === 405) {
        console.log('   ✅ Endpoint exists (405 Method Not Allowed is expected)');
        return true;
      }
    } else {
      console.log('   ❌ Error:', error.message);
      return false;
    }
  }
  
  return false;
}

async function main() {
  console.log('🚀 CAD Group Tools - Webhook Endpoint Testing');
  console.log('==============================================');
  console.log('Base URL:', WEBHOOK_BASE_URL);

  await testWebhookEndpoint('Manus AI', `${WEBHOOK_BASE_URL}/api/webhooks/manus`);
  await testWebhookEndpoint('GoHighLevel', `${WEBHOOK_BASE_URL}/api/webhooks/ghl`);

  console.log('\n==============================================');
  console.log('✅ Webhook endpoint testing complete');
  console.log('\nIf you see 405 errors, that\'s good - it means the endpoints exist');
  console.log('and are correctly configured to reject GET requests.');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

