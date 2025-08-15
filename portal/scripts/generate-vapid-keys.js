#!/usr/bin/env node

/**
 * VAPID Key Generator for Push Notifications
 * CADGroup Tools Portal
 * 
 * Usage: node scripts/generate-vapid-keys.js
 */

const webpush = require('web-push');
const fs = require('fs');
const path = require('path');

console.log('========================================');
console.log('VAPID Key Generator for Push Notifications');
console.log('========================================\n');

// Generate VAPID keys
const vapidKeys = webpush.generateVAPIDKeys();

console.log('Generated VAPID Keys:\n');
console.log('PUBLIC KEY (NEXT_PUBLIC_VAPID_PUBLIC_KEY):');
console.log(vapidKeys.publicKey);
console.log('\nPRIVATE KEY (VAPID_PRIVATE_KEY):');
console.log(vapidKeys.privateKey);
console.log('\n========================================');

// Create .env.local template
const envTemplate = `# Push Notification Configuration
NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}
VAPID_PRIVATE_KEY=${vapidKeys.privateKey}
VAPID_SUBJECT=mailto:admin@cadgroupmgt.com
`;

// Ask user if they want to save to .env.local
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\nIMPORTANT: Add these keys to your Render dashboard environment variables.\n');

rl.question('Do you want to save these keys to .env.local? (y/n): ', (answer) => {
  if (answer.toLowerCase() === 'y') {
    const envPath = path.join(process.cwd(), '.env.local');
    
    // Check if .env.local exists
    if (fs.existsSync(envPath)) {
      rl.question('.env.local already exists. Append to it? (y/n): ', (appendAnswer) => {
        if (appendAnswer.toLowerCase() === 'y') {
          fs.appendFileSync(envPath, '\n' + envTemplate);
          console.log('\nKeys appended to .env.local');
        } else {
          console.log('\nKeys not saved. Please add them manually.');
        }
        rl.close();
      });
    } else {
      fs.writeFileSync(envPath, envTemplate);
      console.log('\nKeys saved to .env.local');
      rl.close();
    }
  } else {
    console.log('\nKeys not saved. Please add them manually to your environment.');
    rl.close();
  }
});

rl.on('close', () => {
  console.log('\n========================================');
  console.log('Setup Instructions:');
  console.log('========================================');
  console.log('1. Add the keys to your Render dashboard:');
  console.log('   - Go to your service settings');
  console.log('   - Navigate to Environment tab');
  console.log('   - Add NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY');
  console.log('\n2. Set VAPID_SUBJECT to: mailto:admin@cadgroupmgt.com');
  console.log('\n3. Redeploy your application');
  console.log('\n4. Test push notifications at: https://cadgrouptools.onrender.com/settings');
  console.log('\n========================================\n');
  process.exit(0);
});