#!/usr/bin/env node

/**
 * Push Notification Monitoring Script
 * CADGroup Tools Portal
 * 
 * Monitors push notification system in production
 * Usage: node scripts/monitor-push-notifications.js
 */

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

// Models
const PushSubscriptionSchema = new mongoose.Schema({
  userId: String,
  subscription: Object,
  userAgent: String,
  isActive: Boolean,
  createdAt: Date,
  lastUsed: Date
});

const NotificationHistorySchema = new mongoose.Schema({
  type: String,
  title: String,
  body: String,
  data: Object,
  sentTo: [String],
  successCount: Number,
  failureCount: Number,
  failures: Array,
  sentBy: String,
  createdAt: Date
});

const PushSubscription = mongoose.model('PushSubscription', PushSubscriptionSchema);
const NotificationHistory = mongoose.model('NotificationHistory', NotificationHistorySchema);

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function connectToDatabase() {
  const mongoUri = process.env.MONGODB_URI;
  
  if (!mongoUri) {
    log('Error: MONGODB_URI not found in environment variables', 'red');
    log('Please set up your .env.local file or pass it as an environment variable', 'yellow');
    process.exit(1);
  }
  
  try {
    await mongoose.connect(mongoUri, {
      dbName: process.env.DB_NAME || 'cadtools'
    });
    log('✓ Connected to MongoDB', 'green');
  } catch (error) {
    log('✗ Failed to connect to MongoDB', 'red');
    console.error(error);
    process.exit(1);
  }
}

async function getSubscriptionStats() {
  const stats = {
    total: await PushSubscription.countDocuments(),
    active: await PushSubscription.countDocuments({ isActive: true }),
    inactive: await PushSubscription.countDocuments({ isActive: false }),
    recentlyUsed: await PushSubscription.countDocuments({
      lastUsed: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    }),
    stale: await PushSubscription.countDocuments({
      lastUsed: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    })
  };
  
  // Get subscriptions by user agent
  const byUserAgent = await PushSubscription.aggregate([
    { $group: { _id: '$userAgent', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 }
  ]);
  
  stats.byUserAgent = byUserAgent;
  
  return stats;
}

async function getNotificationStats(hours = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  const stats = {
    total: await NotificationHistory.countDocuments({
      createdAt: { $gte: since }
    }),
    byType: await NotificationHistory.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { 
        _id: '$type', 
        count: { $sum: 1 },
        successTotal: { $sum: '$successCount' },
        failureTotal: { $sum: '$failureCount' }
      }},
      { $sort: { count: -1 } }
    ]),
    totalSuccess: 0,
    totalFailure: 0,
    successRate: 0
  };
  
  // Calculate totals
  stats.byType.forEach(type => {
    stats.totalSuccess += type.successTotal || 0;
    stats.totalFailure += type.failureTotal || 0;
  });
  
  const total = stats.totalSuccess + stats.totalFailure;
  stats.successRate = total > 0 ? ((stats.totalSuccess / total) * 100).toFixed(2) : 0;
  
  // Get recent failures
  stats.recentFailures = await NotificationHistory.find({
    createdAt: { $gte: since },
    failureCount: { $gt: 0 }
  })
  .sort({ createdAt: -1 })
  .limit(5)
  .select('title type failureCount failures createdAt');
  
  return stats;
}

async function displayDashboard() {
  console.clear();
  
  log(`\n${'='.repeat(60)}`, 'cyan');
  log('Push Notification Monitoring Dashboard', 'cyan');
  log(`Last updated: ${new Date().toLocaleString()}`, 'blue');
  log(`${'='.repeat(60)}`, 'cyan');
  
  // Subscription Statistics
  const subStats = await getSubscriptionStats();
  
  log('\n📱 Subscription Statistics', 'magenta');
  log(`${'─'.repeat(40)}`, 'cyan');
  log(`Total Subscriptions: ${subStats.total}`, 'white');
  log(`  ✓ Active: ${subStats.active}`, 'green');
  log(`  ✗ Inactive: ${subStats.inactive}`, 'red');
  log(`  ⏰ Recently Used (7d): ${subStats.recentlyUsed}`, 'blue');
  log(`  ⚠ Stale (30d+): ${subStats.stale}`, 'yellow');
  
  if (subStats.byUserAgent.length > 0) {
    log('\nTop User Agents:', 'cyan');
    subStats.byUserAgent.forEach(ua => {
      const agent = ua._id || 'Unknown';
      const shortAgent = agent.length > 40 ? agent.substring(0, 40) + '...' : agent;
      log(`  • ${shortAgent}: ${ua.count}`, 'white');
    });
  }
  
  // Notification Statistics (24h)
  const notifStats24h = await getNotificationStats(24);
  
  log('\n📨 Notification Statistics (24 hours)', 'magenta');
  log(`${'─'.repeat(40)}`, 'cyan');
  log(`Total Sent: ${notifStats24h.total}`, 'white');
  log(`Success Rate: ${notifStats24h.successRate}%`, notifStats24h.successRate > 90 ? 'green' : 'yellow');
  log(`  ✓ Successful: ${notifStats24h.totalSuccess}`, 'green');
  log(`  ✗ Failed: ${notifStats24h.totalFailure}`, 'red');
  
  if (notifStats24h.byType.length > 0) {
    log('\nBy Type:', 'cyan');
    notifStats24h.byType.forEach(type => {
      const successRate = type.successTotal + type.failureTotal > 0
        ? ((type.successTotal / (type.successTotal + type.failureTotal)) * 100).toFixed(1)
        : 0;
      log(`  • ${type._id}: ${type.count} sent (${successRate}% success)`, 'white');
    });
  }
  
  if (notifStats24h.recentFailures.length > 0) {
    log('\n⚠ Recent Failures:', 'yellow');
    notifStats24h.recentFailures.forEach(failure => {
      const time = new Date(failure.createdAt).toLocaleTimeString();
      log(`  [${time}] ${failure.title} - ${failure.failureCount} failures`, 'red');
      if (failure.failures && failure.failures.length > 0) {
        const errorSample = failure.failures[0];
        log(`    Error: ${errorSample.error}`, 'red');
      }
    });
  }
  
  // Weekly Statistics
  const notifStats7d = await getNotificationStats(7 * 24);
  
  log('\n📊 Weekly Overview', 'magenta');
  log(`${'─'.repeat(40)}`, 'cyan');
  log(`Total Sent (7d): ${notifStats7d.total}`, 'white');
  log(`Weekly Success Rate: ${notifStats7d.successRate}%`, notifStats7d.successRate > 90 ? 'green' : 'yellow');
  
  // Recommendations
  log('\n💡 Recommendations', 'magenta');
  log(`${'─'.repeat(40)}`, 'cyan');
  
  if (subStats.stale > subStats.active * 0.5) {
    log('⚠ High number of stale subscriptions detected', 'yellow');
    log('  Consider running cleanup: node scripts/cleanup-subscriptions.js', 'white');
  }
  
  if (notifStats24h.successRate < 90) {
    log('⚠ Low success rate detected', 'yellow');
    log('  Check VAPID keys and network connectivity', 'white');
  }
  
  if (subStats.active === 0) {
    log('⚠ No active subscriptions found', 'red');
    log('  Users need to enable push notifications', 'white');
  }
  
  if (notifStats24h.total === 0) {
    log('ℹ No notifications sent in the last 24 hours', 'blue');
  }
  
  log(`\n${'='.repeat(60)}`, 'cyan');
}

async function monitorContinuously() {
  await displayDashboard();
  
  // Refresh every 30 seconds
  setInterval(async () => {
    await displayDashboard();
  }, 30000);
  
  log('\n🔄 Monitoring mode active. Press Ctrl+C to exit.', 'green');
}

async function cleanupStaleSubscriptions() {
  const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  log('\n🧹 Cleaning up stale subscriptions...', 'yellow');
  
  const result = await PushSubscription.deleteMany({
    $or: [
      { isActive: false },
      { lastUsed: { $lt: cutoffDate } }
    ]
  });
  
  log(`✓ Removed ${result.deletedCount} stale subscriptions`, 'green');
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  await connectToDatabase();
  
  switch (command) {
    case 'monitor':
      await monitorContinuously();
      break;
    case 'cleanup':
      await cleanupStaleSubscriptions();
      await displayDashboard();
      process.exit(0);
      break;
    case 'stats':
    default:
      await displayDashboard();
      process.exit(0);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  log('\n\n👋 Monitoring stopped', 'cyan');
  mongoose.connection.close();
  process.exit(0);
});

// Run the script
main().catch(error => {
  log('Error running monitoring script:', 'red');
  console.error(error);
  process.exit(1);
});