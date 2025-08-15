import webpush from 'web-push';
import PushSubscription, { IPushSubscription } from '@/models/PushSubscription';
import NotificationHistory from '@/models/NotificationHistory';
import User from '@/models/User';
import { connectToDatabase } from '@/lib/db';

// Initialize web-push with VAPID keys
// In production, these should be stored in environment variables
const initializeWebPush = () => {
  const vapidKeys = {
    publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
    privateKey: process.env.VAPID_PRIVATE_KEY || '',
    subject: process.env.VAPID_SUBJECT || 'mailto:admin@cadgroupmgt.com'
  };

  // Generate VAPID keys if not present (for development)
  if (!vapidKeys.publicKey || !vapidKeys.privateKey) {
    const generatedKeys = webpush.generateVAPIDKeys();
    console.log('Generated VAPID keys for development:');
    console.log('Public Key:', generatedKeys.publicKey);
    console.log('Private Key:', generatedKeys.privateKey);
    console.log('Add these to your .env.local file');
    
    vapidKeys.publicKey = generatedKeys.publicKey;
    vapidKeys.privateKey = generatedKeys.privateKey;
  }

  webpush.setVapidDetails(
    vapidKeys.subject,
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );

  return vapidKeys.publicKey;
};

// Initialize on module load
const VAPID_PUBLIC_KEY = initializeWebPush();

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  requireInteraction?: boolean;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  data?: Record<string, any>;
}

class PushNotificationService {
  // Get VAPID public key for client
  getVapidPublicKey(): string {
    return VAPID_PUBLIC_KEY;
  }

  // Subscribe a user to push notifications
  async subscribe(userId: string, subscription: PushSubscriptionJSON, userAgent?: string): Promise<IPushSubscription> {
    await connectToDatabase();

    // Check if subscription already exists
    const existingSubscription = await PushSubscription.findOne({
      'subscription.endpoint': subscription.endpoint
    });

    if (existingSubscription) {
      // Update existing subscription
      existingSubscription.userId = userId;
      existingSubscription.isActive = true;
      existingSubscription.userAgent = userAgent;
      existingSubscription.lastUsed = new Date();
      await existingSubscription.save();
      return existingSubscription;
    }

    // Create new subscription
    const newSubscription = await PushSubscription.create({
      userId,
      subscription,
      userAgent,
      isActive: true,
      lastUsed: new Date()
    });

    return newSubscription;
  }

  // Unsubscribe a user from push notifications
  async unsubscribe(userId: string, endpoint?: string): Promise<boolean> {
    await connectToDatabase();

    if (endpoint) {
      // Unsubscribe specific endpoint
      const result = await PushSubscription.updateOne(
        { userId, 'subscription.endpoint': endpoint },
        { isActive: false }
      );
      return result.modifiedCount > 0;
    } else {
      // Unsubscribe all endpoints for user
      const result = await PushSubscription.updateMany(
        { userId },
        { isActive: false }
      );
      return result.modifiedCount > 0;
    }
  }

  // Get all active subscriptions for a user
  async getUserSubscriptions(userId: string): Promise<IPushSubscription[]> {
    await connectToDatabase();
    return await PushSubscription.find({ userId, isActive: true });
  }

  // Send notification to specific users
  async sendToUsers(
    userIds: string[], 
    notification: NotificationPayload,
    type: 'user_registration' | 'report_complete' | 'login_attempt' | 'system_alert' | 'custom' = 'custom',
    sentBy?: string
  ): Promise<{ successCount: number; failureCount: number }> {
    await connectToDatabase();

    // Get all active subscriptions for the users
    const subscriptions = await PushSubscription.find({
      userId: { $in: userIds },
      isActive: true
    });

    if (subscriptions.length === 0) {
      console.log('No active subscriptions found for users:', userIds);
      return { successCount: 0, failureCount: 0 };
    }

    let successCount = 0;
    let failureCount = 0;
    const failures: Array<{ userId: string; error: string }> = [];

    // Send notification to each subscription
    const sendPromises = subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          sub.subscription as any,
          JSON.stringify(notification)
        );
        successCount++;
        
        // Update last used
        await PushSubscription.updateOne(
          { _id: sub._id },
          { lastUsed: new Date() }
        );
      } catch (error: any) {
        failureCount++;
        failures.push({
          userId: sub.userId,
          error: error.message || 'Unknown error'
        });

        // Handle subscription gone (410 status)
        if (error.statusCode === 410) {
          await PushSubscription.updateOne(
            { _id: sub._id },
            { isActive: false }
          );
        }

        console.error(`Failed to send notification to user ${sub.userId}:`, error);
      }
    });

    await Promise.all(sendPromises);

    // Save notification history
    await NotificationHistory.create({
      type,
      title: notification.title,
      body: notification.body,
      data: notification.data,
      sentTo: userIds,
      successCount,
      failureCount,
      failures: failures.length > 0 ? failures : undefined,
      sentBy
    });

    return { successCount, failureCount };
  }

  // Send notification to all admins
  async sendToAdmins(notification: NotificationPayload, type: 'user_registration' | 'report_complete' | 'login_attempt' | 'system_alert' | 'custom' = 'system_alert'): Promise<{ successCount: number; failureCount: number }> {
    await connectToDatabase();
    
    // Get all admin users
    const admins = await User.find({ role: 'admin', isActive: true }, '_id');
    const adminIds = admins.map(admin => admin._id.toString());

    if (adminIds.length === 0) {
      console.log('No active admins found');
      return { successCount: 0, failureCount: 0 };
    }

    return this.sendToUsers(adminIds, notification, type);
  }

  // Send notification to all users
  async sendToAll(notification: NotificationPayload, type: 'system_alert' | 'custom' = 'system_alert', sentBy?: string): Promise<{ successCount: number; failureCount: number }> {
    await connectToDatabase();
    
    // Get all active users
    const users = await User.find({ isActive: true }, '_id');
    const userIds = users.map(user => user._id.toString());

    if (userIds.length === 0) {
      console.log('No active users found');
      return { successCount: 0, failureCount: 0 };
    }

    return this.sendToUsers(userIds, notification, type, sentBy);
  }

  // Notification templates for different events
  async notifyNewUserRegistration(newUser: { name: string; email: string; role: string }): Promise<void> {
    const notification: NotificationPayload = {
      title: 'New User Registration',
      body: `${newUser.name} (${newUser.email}) has registered as ${newUser.role}`,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      tag: 'user-registration',
      requireInteraction: true,
      data: {
        type: 'user_registration',
        userId: newUser.email,
        timestamp: new Date().toISOString()
      }
    };

    await this.sendToAdmins(notification, 'user_registration');
  }

  async notifyReportComplete(userId: string, reportName: string, reportId: string): Promise<void> {
    const notification: NotificationPayload = {
      title: 'Report Generation Complete',
      body: `Your report "${reportName}" is ready to view`,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      tag: `report-${reportId}`,
      actions: [
        {
          action: 'view',
          title: 'View Report'
        },
        {
          action: 'download',
          title: 'Download'
        }
      ],
      data: {
        type: 'report_complete',
        reportId,
        timestamp: new Date().toISOString()
      }
    };

    await this.sendToUsers([userId], notification, 'report_complete');
  }

  async notifyFailedLogin(userId: string, attemptDetails: { ip: string; userAgent: string; location?: string }): Promise<void> {
    const notification: NotificationPayload = {
      title: 'Security Alert: Failed Login Attempt',
      body: `Failed login attempt from ${attemptDetails.location || attemptDetails.ip}`,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      tag: 'security-alert',
      requireInteraction: true,
      data: {
        type: 'login_attempt',
        ...attemptDetails,
        timestamp: new Date().toISOString()
      }
    };

    await this.sendToUsers([userId], notification, 'login_attempt');
  }

  async sendSystemAlert(title: string, message: string, severity: 'info' | 'warning' | 'error' = 'info'): Promise<void> {
    const notification: NotificationPayload = {
      title: `System ${severity.toUpperCase()}: ${title}`,
      body: message,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      tag: 'system-alert',
      requireInteraction: severity !== 'info',
      data: {
        type: 'system_alert',
        severity,
        timestamp: new Date().toISOString()
      }
    };

    await this.sendToAll(notification, 'system_alert');
  }

  async sendCustomNotification(
    targetUsers: string[] | 'all' | 'admins',
    title: string,
    body: string,
    options?: Partial<NotificationPayload>,
    sentBy?: string
  ): Promise<{ successCount: number; failureCount: number }> {
    const notification: NotificationPayload = {
      title,
      body,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      ...options,
      data: {
        type: 'custom',
        sentBy,
        timestamp: new Date().toISOString(),
        ...options?.data
      }
    };

    if (targetUsers === 'all') {
      return this.sendToAll(notification, 'custom', sentBy);
    } else if (targetUsers === 'admins') {
      return this.sendToAdmins(notification, 'custom');
    } else {
      return this.sendToUsers(targetUsers, notification, 'custom', sentBy);
    }
  }

  // Get notification history
  async getNotificationHistory(limit: number = 50, userId?: string): Promise<any[]> {
    await connectToDatabase();
    
    const query = userId ? { userId } : {};
    return await NotificationHistory.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  // Clean up old/inactive subscriptions
  async cleanupInactiveSubscriptions(daysInactive: number = 30): Promise<number> {
    await connectToDatabase();
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysInactive);

    const result = await PushSubscription.deleteMany({
      $or: [
        { isActive: false },
        { lastUsed: { $lt: cutoffDate } }
      ]
    });

    return result.deletedCount;
  }
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService();
export default pushNotificationService;