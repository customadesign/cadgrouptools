#!/usr/bin/env node

/**
 * Push Notification Testing Script
 * CADGroup Tools Portal
 * 
 * Tests push notification functionality in production
 * Usage: node scripts/test-push-notifications.js
 */

const https = require('https');
const readline = require('readline');

// Configuration
const PRODUCTION_URL = 'https://cadgrouptools.onrender.com';
const LOCAL_URL = 'http://localhost:3000';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test functions
async function testHealthCheck(baseUrl) {
  return new Promise((resolve) => {
    log('\nTesting Push Notification Health Check...', 'cyan');
    
    const url = new URL(`${baseUrl}/api/health/push`);
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          
          if (result.status === 'healthy') {
            log('✓ Health check passed', 'green');
            log(`  Active subscriptions: ${result.metrics.activeSubscriptions}`, 'blue');
            log(`  Success rate: ${result.metrics.successRate}%`, 'blue');
            log(`  VAPID configured: ${result.config.vapidConfigured}`, 'blue');
            resolve(true);
          } else {
            log('✗ Health check failed', 'red');
            log(`  Error: ${result.error}`, 'red');
            resolve(false);
          }
        } catch (error) {
          log('✗ Failed to parse health check response', 'red');
          console.error(error);
          resolve(false);
        }
      });
    }).on('error', (err) => {
      log('✗ Failed to connect to health check endpoint', 'red');
      console.error(err);
      resolve(false);
    });
  });
}

async function testVapidKey(baseUrl) {
  return new Promise((resolve) => {
    log('\nTesting VAPID Public Key Endpoint...', 'cyan');
    
    const url = new URL(`${baseUrl}/api/notifications/vapid-key`);
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          
          if (result.publicKey) {
            log('✓ VAPID public key retrieved', 'green');
            log(`  Key length: ${result.publicKey.length} characters`, 'blue');
            resolve(true);
          } else {
            log('✗ No VAPID public key found', 'red');
            resolve(false);
          }
        } catch (error) {
          log('✗ Failed to parse VAPID key response', 'red');
          console.error(error);
          resolve(false);
        }
      });
    }).on('error', (err) => {
      log('✗ Failed to connect to VAPID key endpoint', 'red');
      console.error(err);
      resolve(false);
    });
  });
}

async function testServiceWorker(baseUrl) {
  return new Promise((resolve) => {
    log('\nTesting Service Worker File...', 'cyan');
    
    const url = new URL(`${baseUrl}/sw.js`);
    
    https.get(url, (res) => {
      if (res.statusCode === 200) {
        log('✓ Service worker file accessible', 'green');
        log(`  Content-Type: ${res.headers['content-type']}`, 'blue');
        resolve(true);
      } else {
        log(`✗ Service worker file not accessible (Status: ${res.statusCode})`, 'red');
        resolve(false);
      }
    }).on('error', (err) => {
      log('✗ Failed to access service worker file', 'red');
      console.error(err);
      resolve(false);
    });
  });
}

async function testManifest(baseUrl) {
  return new Promise((resolve) => {
    log('\nTesting Web App Manifest...', 'cyan');
    
    const url = new URL(`${baseUrl}/manifest.json`);
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const manifest = JSON.parse(data);
          
          if (manifest.name && manifest.icons) {
            log('✓ Web app manifest valid', 'green');
            log(`  App name: ${manifest.name}`, 'blue');
            log(`  Icons count: ${manifest.icons.length}`, 'blue');
            resolve(true);
          } else {
            log('✗ Web app manifest incomplete', 'red');
            resolve(false);
          }
        } catch (error) {
          log('✗ Failed to parse manifest', 'red');
          console.error(error);
          resolve(false);
        }
      });
    }).on('error', (err) => {
      log('✗ Failed to access manifest file', 'red');
      console.error(err);
      resolve(false);
    });
  });
}

async function checkHTTPS(baseUrl) {
  if (baseUrl.startsWith('https://')) {
    log('\n✓ HTTPS enabled (required for push notifications)', 'green');
    return true;
  } else if (baseUrl.includes('localhost')) {
    log('\n⚠ Local development detected - HTTPS not required', 'yellow');
    return true;
  } else {
    log('\n✗ HTTPS not enabled - push notifications will not work', 'red');
    return false;
  }
}

// Main test runner
async function runTests(baseUrl) {
  log(`\n${'='.repeat(50)}`, 'cyan');
  log('Push Notification System Test', 'cyan');
  log(`Testing: ${baseUrl}`, 'cyan');
  log(`${'='.repeat(50)}`, 'cyan');
  
  const results = {
    https: await checkHTTPS(baseUrl),
    health: await testHealthCheck(baseUrl),
    vapid: await testVapidKey(baseUrl),
    serviceWorker: await testServiceWorker(baseUrl),
    manifest: await testManifest(baseUrl)
  };
  
  // Summary
  log(`\n${'='.repeat(50)}`, 'cyan');
  log('Test Summary', 'cyan');
  log(`${'='.repeat(50)}`, 'cyan');
  
  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;
  
  Object.entries(results).forEach(([test, result]) => {
    const status = result ? '✓' : '✗';
    const color = result ? 'green' : 'red';
    log(`${status} ${test.charAt(0).toUpperCase() + test.slice(1)}`, color);
  });
  
  log(`\nTests passed: ${passed}/${total}`, passed === total ? 'green' : 'yellow');
  
  if (passed === total) {
    log('\n✓ Push notification system is ready for production!', 'green');
  } else {
    log('\n⚠ Some tests failed. Please check the configuration.', 'yellow');
    log('\nTroubleshooting steps:', 'cyan');
    
    if (!results.health) {
      log('1. Ensure MongoDB is connected and VAPID keys are set', 'yellow');
    }
    if (!results.vapid) {
      log('2. Generate VAPID keys: node scripts/generate-vapid-keys.js', 'yellow');
    }
    if (!results.serviceWorker) {
      log('3. Ensure service worker file exists at /public/sw.js', 'yellow');
    }
    if (!results.manifest) {
      log('4. Check web app manifest at /public/manifest.json', 'yellow');
    }
  }
  
  return passed === total;
}

// Interactive menu
function showMenu() {
  log(`\n${'='.repeat(50)}`, 'cyan');
  log('Push Notification Testing Tool', 'cyan');
  log(`${'='.repeat(50)}`, 'cyan');
  log('\nSelect environment to test:', 'yellow');
  log('1. Production (https://cadgrouptools.onrender.com)', 'blue');
  log('2. Local (http://localhost:3000)', 'blue');
  log('3. Custom URL', 'blue');
  log('4. Exit', 'blue');
  
  rl.question('\nEnter your choice (1-4): ', async (choice) => {
    let baseUrl;
    
    switch (choice) {
      case '1':
        baseUrl = PRODUCTION_URL;
        break;
      case '2':
        baseUrl = LOCAL_URL;
        break;
      case '3':
        rl.question('Enter custom URL: ', async (customUrl) => {
          baseUrl = customUrl;
          const success = await runTests(baseUrl);
          
          rl.question('\nRun another test? (y/n): ', (answer) => {
            if (answer.toLowerCase() === 'y') {
              showMenu();
            } else {
              log('\nGoodbye!', 'cyan');
              rl.close();
            }
          });
        });
        return;
      case '4':
        log('\nGoodbye!', 'cyan');
        rl.close();
        return;
      default:
        log('Invalid choice. Please try again.', 'red');
        showMenu();
        return;
    }
    
    const success = await runTests(baseUrl);
    
    rl.question('\nRun another test? (y/n): ', (answer) => {
      if (answer.toLowerCase() === 'y') {
        showMenu();
      } else {
        log('\nGoodbye!', 'cyan');
        rl.close();
      }
    });
  });
}

// Start the tool
showMenu();