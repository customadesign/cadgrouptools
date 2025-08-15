/**
 * Test script for Activity Logging System
 * Run with: node scripts/test-activity-logging.js
 */

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

// MongoDB connection
async function connectDB() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI not found in environment variables');
    }
    
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Define the ActivityLog schema for testing
const ActivityLogSchema = new mongoose.Schema({
  userId: String,
  userName: String,
  userEmail: String,
  userRole: String,
  actionType: String,
  resourceType: String,
  resourceId: String,
  resourceName: String,
  method: String,
  endpoint: String,
  ipAddress: String,
  userAgent: String,
  timestamp: Date,
  success: Boolean,
  errorMessage: String,
  statusCode: Number,
  responseTime: Number,
  metadata: mongoose.Schema.Types.Mixed,
  changes: {
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed
  }
});

const ActivityLog = mongoose.model('ActivityLog', ActivityLogSchema);

// Generate sample activity logs
async function generateSampleLogs() {
  console.log('\n📝 Generating sample activity logs...');
  
  const users = [
    { id: '1', name: 'John Admin', email: 'john@example.com', role: 'admin' },
    { id: '2', name: 'Jane Staff', email: 'jane@example.com', role: 'staff' },
    { id: '3', name: 'Bob Manager', email: 'bob@example.com', role: 'admin' }
  ];
  
  const actionTypes = ['login', 'logout', 'create', 'update', 'delete', 'view', 'upload', 'download'];
  const resourceTypes = ['user', 'client', 'proposal', 'report', 'file'];
  const methods = ['GET', 'POST', 'PUT', 'DELETE'];
  const ipAddresses = ['192.168.1.1', '10.0.0.1', '172.16.0.1'];
  
  const logs = [];
  
  // Generate logs for the past 7 days
  for (let daysAgo = 7; daysAgo >= 0; daysAgo--) {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    
    // Generate 10-20 logs per day
    const logsPerDay = Math.floor(Math.random() * 10) + 10;
    
    for (let i = 0; i < logsPerDay; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const actionType = actionTypes[Math.floor(Math.random() * actionTypes.length)];
      const resourceType = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
      const method = methods[Math.floor(Math.random() * methods.length)];
      const success = Math.random() > 0.1; // 90% success rate
      
      const log = {
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        userRole: user.role,
        actionType,
        resourceType,
        resourceId: Math.random() > 0.5 ? `${resourceType}_${Math.floor(Math.random() * 1000)}` : undefined,
        resourceName: Math.random() > 0.5 ? `Sample ${resourceType} ${i}` : undefined,
        method,
        endpoint: `/api/${resourceType}s`,
        ipAddress: ipAddresses[Math.floor(Math.random() * ipAddresses.length)],
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        timestamp: new Date(date.getTime() + Math.random() * 86400000), // Random time during the day
        success,
        errorMessage: !success ? 'Sample error message' : undefined,
        statusCode: success ? 200 : (Math.random() > 0.5 ? 404 : 500),
        responseTime: Math.floor(Math.random() * 500) + 50,
        metadata: {
          browser: 'Chrome',
          os: 'Windows',
          sampleData: `test_${i}`
        }
      };
      
      logs.push(log);
    }
  }
  
  // Insert logs
  try {
    await ActivityLog.insertMany(logs);
    console.log(`✅ Inserted ${logs.length} sample activity logs`);
  } catch (error) {
    console.error('❌ Error inserting logs:', error);
  }
}

// Test queries
async function testQueries() {
  console.log('\n🔍 Testing queries...');
  
  // Test 1: Count total logs
  const totalCount = await ActivityLog.countDocuments();
  console.log(`Total logs: ${totalCount}`);
  
  // Test 2: Get logs by user
  const userLogs = await ActivityLog.find({ userName: 'John Admin' }).limit(5);
  console.log(`Logs for John Admin: ${userLogs.length}`);
  
  // Test 3: Get failed operations
  const failedOps = await ActivityLog.find({ success: false }).limit(5);
  console.log(`Failed operations: ${failedOps.length}`);
  
  // Test 4: Get today's logs
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayLogs = await ActivityLog.find({
    timestamp: { $gte: today }
  });
  console.log(`Today's logs: ${todayLogs.length}`);
  
  // Test 5: Aggregate by action type
  const actionTypeStats = await ActivityLog.aggregate([
    {
      $group: {
        _id: '$actionType',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);
  console.log('\nAction type distribution:');
  actionTypeStats.forEach(stat => {
    console.log(`  ${stat._id}: ${stat.count}`);
  });
  
  // Test 6: Average response time
  const avgResponseTime = await ActivityLog.aggregate([
    {
      $match: {
        responseTime: { $exists: true }
      }
    },
    {
      $group: {
        _id: null,
        avgTime: { $avg: '$responseTime' }
      }
    }
  ]);
  if (avgResponseTime[0]) {
    console.log(`\nAverage response time: ${avgResponseTime[0].avgTime.toFixed(2)}ms`);
  }
}

// Test index performance
async function testIndexPerformance() {
  console.log('\n⚡ Testing index performance...');
  
  const queries = [
    { userId: '1' },
    { actionType: 'login' },
    { resourceType: 'client' },
    { success: false },
    { timestamp: { $gte: new Date(Date.now() - 86400000) } }
  ];
  
  for (const query of queries) {
    const startTime = Date.now();
    const count = await ActivityLog.countDocuments(query);
    const endTime = Date.now();
    console.log(`Query ${JSON.stringify(query)}: ${count} results in ${endTime - startTime}ms`);
  }
}

// Clean up test data (optional)
async function cleanupTestData() {
  console.log('\n🧹 Cleaning up test data...');
  
  const result = await ActivityLog.deleteMany({
    metadata: { $exists: true },
    'metadata.sampleData': { $regex: /^test_/ }
  });
  
  console.log(`Deleted ${result.deletedCount} test logs`);
}

// Main function
async function main() {
  try {
    await connectDB();
    
    console.log('\n🚀 Activity Logging System Test\n');
    console.log('================================\n');
    
    // Check if we should generate sample data
    const args = process.argv.slice(2);
    
    if (args.includes('--generate')) {
      await generateSampleLogs();
    }
    
    if (args.includes('--test')) {
      await testQueries();
      await testIndexPerformance();
    }
    
    if (args.includes('--cleanup')) {
      await cleanupTestData();
    }
    
    if (args.length === 0) {
      console.log('Usage: node scripts/test-activity-logging.js [options]');
      console.log('\nOptions:');
      console.log('  --generate  Generate sample activity logs');
      console.log('  --test      Run test queries');
      console.log('  --cleanup   Remove test data');
      console.log('\nExample: node scripts/test-activity-logging.js --generate --test');
    }
    
    console.log('\n✨ Test completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the script
main();