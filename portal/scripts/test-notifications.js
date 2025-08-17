const mongoose = require('mongoose');
const { notificationService } = require('../dist/services/notificationService');
const { connectToDatabase } = require('../dist/lib/db');
require('dotenv').config();

async function testNotificationSystem() {
  console.log('Testing Notification System...\n');

  try {
    // Connect to database
    await connectToDatabase();
    console.log('✅ Connected to database');

    // Get a test user (you'll need to update this with an actual user ID from your database)
    const User = require('../dist/models/User').default;
    const testUser = await User.findOne({ role: 'admin' });
    
    if (!testUser) {
      console.error('❌ No admin user found for testing. Please create an admin user first.');
      process.exit(1);
    }

    console.log(`✅ Found test user: ${testUser.name} (${testUser.email})\n`);

    // Test 1: Create a single notification
    console.log('Test 1: Creating single notification...');
    const notification1 = await notificationService.createNotification({
      userId: testUser._id.toString(),
      type: 'system',
      title: 'Test Notification',
      message: 'This is a test notification from the notification system test script.',
      priority: 'medium',
      actionUrl: '/dashboard',
    });
    console.log('✅ Single notification created:', notification1._id);

    // Test 2: Test user registration notification
    console.log('\nTest 2: Testing user registration notification...');
    await notificationService.notifyUserRegistration({
      userId: 'test-user-id',
      name: 'Test User',
      email: 'test@example.com',
      role: 'staff',
    });
    console.log('✅ User registration notification sent to all admins');

    // Test 3: Test statement upload notification
    console.log('\nTest 3: Testing statement upload notification...');
    await notificationService.notifyStatementUpload({
      statementId: 'test-statement-id',
      accountName: 'Test Account',
      month: 11,
      year: 2024,
      uploadedBy: testUser._id.toString(),
      uploadedByName: testUser.name,
    });
    console.log('✅ Statement upload notification sent');

    // Test 4: Test proposal creation notification
    console.log('\nTest 4: Testing proposal creation notification...');
    await notificationService.notifyProposalCreation({
      proposalId: 'test-proposal-id',
      clientName: 'Test Client Inc.',
      createdBy: testUser._id.toString(),
      createdByName: testUser.name,
      services: ['Web Development', 'SEO', 'Content Marketing'],
    });
    console.log('✅ Proposal creation notification sent');

    // Test 5: Get user notifications
    console.log('\nTest 5: Fetching user notifications...');
    const userNotifications = await notificationService.getUserNotifications(
      testUser._id.toString(),
      { page: 1, limit: 10 }
    );
    console.log(`✅ Found ${userNotifications.notifications.length} notifications`);
    console.log(`   Total: ${userNotifications.pagination.total}`);
    console.log(`   Pages: ${userNotifications.pagination.pages}`);

    // Test 6: Get unread count
    console.log('\nTest 6: Getting unread count...');
    const unreadCount = await notificationService.getUnreadCount(testUser._id.toString());
    console.log(`✅ Unread notifications: ${unreadCount}`);

    // Test 7: Mark notification as read
    if (userNotifications.notifications.length > 0) {
      console.log('\nTest 7: Marking first notification as read...');
      const firstNotification = userNotifications.notifications[0];
      const marked = await notificationService.markAsRead(
        firstNotification._id.toString(),
        testUser._id.toString()
      );
      console.log(`✅ Notification marked as read: ${marked}`);

      // Verify unread count decreased
      const newUnreadCount = await notificationService.getUnreadCount(testUser._id.toString());
      console.log(`   New unread count: ${newUnreadCount}`);
    }

    // Test 8: Mark all as read
    console.log('\nTest 8: Marking all notifications as read...');
    const markedCount = await notificationService.markAllAsRead(testUser._id.toString());
    console.log(`✅ Marked ${markedCount} notifications as read`);

    // Test 9: Delete a notification
    if (notification1) {
      console.log('\nTest 9: Deleting test notification...');
      const deleted = await notificationService.deleteNotification(
        notification1._id.toString(),
        testUser._id.toString()
      );
      console.log(`✅ Notification deleted: ${deleted}`);
    }

    // Test 10: Clean up old notifications
    console.log('\nTest 10: Testing cleanup of old notifications...');
    const cleaned = await notificationService.cleanupOldNotifications(30);
    console.log(`✅ Cleaned up ${cleaned} old notifications`);

    console.log('\n✅ All notification system tests passed!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  }
}

// Run tests
testNotificationSystem();