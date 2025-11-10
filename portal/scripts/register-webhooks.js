#!/usr/bin/env node

/**
 * Script to register webhooks with Manus AI and GoHighLevel
 * Run this after deploying to production or updating webhook URLs
 */

const axios = require('axios');
require('dotenv').config({ path: '../.env' });

const WEBHOOK_BASE_URL = process.env.NEXTAUTH_URL || 'https://cadgrouptools.onrender.com';

async function registerManusWebhook() {
  console.log('\n📡 Registering Manus AI webhook...');
  
  const manusApiKey = process.env.MANUS_API_KEY;
  const manusBaseUrl = process.env.MANUS_BASE_URL || 'https://api.manus.ai/v1';
  
  if (!manusApiKey) {
    console.error('❌ MANUS_API_KEY not set');
    return false;
  }

  try {
    const response = await axios.post(
      `${manusBaseUrl}/webhooks`,
      {
        url: `${WEBHOOK_BASE_URL}/api/webhooks/manus`,
        events: ['task.completed', 'task.failed', 'task.processing'],
      },
      {
        headers: {
          'Authorization': `Bearer ${manusApiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ Manus webhook registered successfully');
    console.log('   Webhook ID:', response.data.id || response.data.webhook_id);
    console.log('   URL:', `${WEBHOOK_BASE_URL}/api/webhooks/manus`);
    console.log('   Events:', response.data.events);
    
    return true;
  } catch (error) {
    console.error('❌ Failed to register Manus webhook');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Error:', error.response.data);
    } else {
      console.error('   Error:', error.message);
    }
    return false;
  }
}

async function registerGoHighLevelWebhook() {
  console.log('\n📡 Registering GoHighLevel webhook...');
  
  const ghlApiKey = process.env.GHL_API_KEY;
  const ghlLocationId = process.env.GHL_LOCATION_ID;
  
  if (!ghlApiKey) {
    console.error('❌ GHL_API_KEY not set');
    return false;
  }
  
  if (!ghlLocationId) {
    console.error('❌ GHL_LOCATION_ID not set');
    return false;
  }

  try {
    const response = await axios.post(
      'https://rest.gohighlevel.com/v1/webhooks',
      {
        locationId: ghlLocationId,
        url: `${WEBHOOK_BASE_URL}/api/webhooks/ghl`,
        events: ['FormSubmitted'],
      },
      {
        headers: {
          'Authorization': `Bearer ${ghlApiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ GoHighLevel webhook registered successfully');
    console.log('   Webhook ID:', response.data.id || response.data.webhook_id);
    console.log('   URL:', `${WEBHOOK_BASE_URL}/api/webhooks/ghl`);
    console.log('   Location ID:', ghlLocationId);
    console.log('   Events:', response.data.events || ['FormSubmitted']);
    
    return true;
  } catch (error) {
    console.error('❌ Failed to register GoHighLevel webhook');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Error:', error.response.data);
    } else {
      console.error('   Error:', error.message);
    }
    return false;
  }
}

async function main() {
  console.log('🚀 CAD Group Tools - Webhook Registration');
  console.log('==========================================');
  console.log('Base URL:', WEBHOOK_BASE_URL);
  console.log('');

  const results = await Promise.all([
    registerManusWebhook(),
    registerGoHighLevelWebhook(),
  ]);

  const allSuccessful = results.every(r => r);

  console.log('\n==========================================');
  if (allSuccessful) {
    console.log('✅ All webhooks registered successfully!');
    console.log('\nNext steps:');
    console.log('1. Set MANUS_WEBHOOK_SECRET in your environment');
    console.log('2. Set GHL_WEBHOOK_SECRET in your environment');
    console.log('3. Test webhooks by submitting a form or uploading a document');
  } else {
    console.log('⚠️  Some webhooks failed to register');
    console.log('Please check the errors above and try again');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

