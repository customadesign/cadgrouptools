import { Types } from 'mongoose';
import Notification, { INotification } from '@/models/Notification';
import User from '@/models/User';
import { connectToDatabase } from '@/lib/db';
import { socketServer } from '@/lib/socketServer';

export interface NotificationPayload {
  userId?: string | Types.ObjectId;
  type: INotification['type'];
  title: string;
  message: string;
  data?: Record<string, any>;
  priority?: INotification['priority'];
  actionUrl?: string;
  createdBy?: string | Types.ObjectId;
}

class NotificationService {
  /**
   * Create and emit a notification to a specific user
   */
  async createNotification(payload: NotificationPayload): Promise<INotification> {
    await connectToDatabase();

    const notification = await Notification.create({
      userId: new Types.ObjectId(payload.userId as string),
      type: payload.type,
      title: payload.title,
      message: payload.message,
      data: payload.data || {},
      priority: payload.priority || 'medium',
      actionUrl: payload.actionUrl,
      createdBy: payload.createdBy ? new Types.ObjectId(payload.createdBy as string) : undefined,
      read: false,
    });

    // Emit real-time notification if user is online
    if (payload.userId) {
      socketServer.emitToUser(payload.userId.toString(), 'notification:new', {
        id: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        priority: notification.priority,
        actionUrl: notification.actionUrl,
        createdAt: notification.createdAt,
      });

      // Also emit unread count update
      const unreadCount = await this.getUnreadCount(payload.userId.toString());
      socketServer.emitToUser(payload.userId.toString(), 'notification:unread-count', unreadCount);
    }

    return notification;
  }

  /**
   * Create notifications for multiple users
   */
  async createBulkNotifications(
    userIds: string[],
    payload: Omit<NotificationPayload, 'userId'>
  ): Promise<INotification[]> {
    await connectToDatabase();

    const notifications = await Notification.insertMany(
      userIds.map(userId => ({
        userId: new Types.ObjectId(userId),
        type: payload.type,
        title: payload.title,
        message: payload.message,
        data: payload.data || {},
        priority: payload.priority || 'medium',
        actionUrl: payload.actionUrl,
        createdBy: payload.createdBy ? new Types.ObjectId(payload.createdBy as string) : undefined,
        read: false,
      }))
    );

    // Emit to all online users
    for (const userId of userIds) {
      const userNotification = notifications.find(n => n.userId.toString() === userId);
      if (userNotification) {
        socketServer.emitToUser(userId, 'notification:new', {
          id: userNotification._id,
          type: userNotification.type,
          title: userNotification.title,
          message: userNotification.message,
          data: userNotification.data,
          priority: userNotification.priority,
          actionUrl: userNotification.actionUrl,
          createdAt: userNotification.createdAt,
        });

        // Emit updated unread count
        const unreadCount = await this.getUnreadCount(userId);
        socketServer.emitToUser(userId, 'notification:unread-count', unreadCount);
      }
    }

    return notifications;
  }

  /**
   * Notify all admins about an event
   */
  async notifyAdmins(payload: Omit<NotificationPayload, 'userId'>): Promise<INotification[]> {
    await connectToDatabase();

    // Get all admin users
    const admins = await User.find({ role: 'admin', isActive: true }).select('_id');
    const adminIds = admins.map(admin => admin._id.toString());

    if (adminIds.length === 0) {
      console.warn('No active admins found to notify');
      return [];
    }

    return this.createBulkNotifications(adminIds, payload);
  }

  /**
   * Notify about new user registration
   */
  async notifyUserRegistration(userData: {
    userId: string;
    name: string;
    email: string;
    role: string;
  }): Promise<void> {
    // Notify admins
    await this.notifyAdmins({
      type: 'user_registration',
      title: 'New User Registration',
      message: `${userData.name} (${userData.email}) has registered as ${userData.role}`,
      data: {
        userId: userData.userId,
        userName: userData.name,
        userEmail: userData.email,
        userRole: userData.role,
      },
      priority: 'high',
      actionUrl: `/admin/users?highlight=${userData.userId}`,
    });

    // Also emit a global event for real-time dashboards
    socketServer.emitToAdmins('event:user-registered', userData);
  }

  /**
   * Notify about new statement upload
   */
  async notifyStatementUpload(data: {
    statementId: string;
    accountName: string;
    month: number;
    year: number;
    uploadedBy: string;
    uploadedByName?: string;
  }): Promise<void> {
    // Get all users who should be notified (admins and the uploader)
    const admins = await User.find({ role: 'admin', isActive: true }).select('_id');
    const notifyUserIds = new Set(admins.map(a => a._id.toString()));
    
    // Don't notify the uploader if they're already an admin
    if (!notifyUserIds.has(data.uploadedBy)) {
      notifyUserIds.add(data.uploadedBy);
    }

    const monthName = new Date(data.year, data.month - 1).toLocaleString('default', { month: 'long' });

    await this.createBulkNotifications(Array.from(notifyUserIds), {
      type: 'statement_upload',
      title: 'New Statement Uploaded',
      message: `Statement for ${data.accountName} (${monthName} ${data.year}) has been uploaded${data.uploadedByName ? ` by ${data.uploadedByName}` : ''}`,
      data: {
        statementId: data.statementId,
        accountName: data.accountName,
        month: data.month,
        year: data.year,
        uploadedBy: data.uploadedBy,
      },
      priority: 'medium',
      actionUrl: `/accounting?statement=${data.statementId}`,
      createdBy: data.uploadedBy,
    });

    // Emit real-time event
    socketServer.emitToAdmins('event:statement-uploaded', data);
  }

  /**
   * Notify about new proposal creation
   */
  async notifyProposalCreation(data: {
    proposalId: string;
    clientName: string;
    createdBy: string;
    createdByName?: string;
    services: string[];
  }): Promise<void> {
    // Get all users who should be notified
    const admins = await User.find({ role: 'admin', isActive: true }).select('_id');
    const notifyUserIds = new Set(admins.map(a => a._id.toString()));
    
    // Include the creator if not already an admin
    if (!notifyUserIds.has(data.createdBy)) {
      notifyUserIds.add(data.createdBy);
    }

    const servicesText = data.services.length > 2 
      ? `${data.services.slice(0, 2).join(', ')} and ${data.services.length - 2} more`
      : data.services.join(', ');

    await this.createBulkNotifications(Array.from(notifyUserIds), {
      type: 'proposal_creation',
      title: 'New Proposal Created',
      message: `New proposal for ${data.clientName}${data.createdByName ? ` created by ${data.createdByName}` : ''} with services: ${servicesText}`,
      data: {
        proposalId: data.proposalId,
        clientName: data.clientName,
        services: data.services,
        createdBy: data.createdBy,
      },
      priority: 'medium',
      actionUrl: `/proposals/${data.proposalId}`,
      createdBy: data.createdBy,
    });

    // Emit real-time event
    socketServer.emitToAll('event:proposal-created', data);
  }

  /**
   * Get user's notifications with pagination
   */
  async getUserNotifications(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      unreadOnly?: boolean;
      type?: INotification['type'];
    } = {}
  ) {
    await connectToDatabase();

    const {
      page = 1,
      limit = 20,
      unreadOnly = false,
      type,
    } = options;

    const query: any = { userId: new Types.ObjectId(userId) };
    
    if (unreadOnly) {
      query.read = false;
    }
    
    if (type) {
      query.type = type;
    }

    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'name email')
        .lean(),
      Notification.countDocuments(query),
    ]);

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    await connectToDatabase();

    const notification = await Notification.findOneAndUpdate(
      { 
        _id: new Types.ObjectId(notificationId),
        userId: new Types.ObjectId(userId),
        read: false,
      },
      {
        read: true,
        readAt: new Date(),
      },
      { new: true }
    );

    if (notification) {
      // Emit updated unread count
      const unreadCount = await this.getUnreadCount(userId);
      socketServer.emitToUser(userId, 'notification:unread-count', unreadCount);
      
      // Emit read status update
      socketServer.emitToUser(userId, 'notification:read', notificationId);
      
      return true;
    }

    return false;
  }

  /**
   * Mark multiple notifications as read
   */
  async markMultipleAsRead(notificationIds: string[], userId: string): Promise<number> {
    await connectToDatabase();

    const result = await Notification.updateMany(
      {
        _id: { $in: notificationIds.map(id => new Types.ObjectId(id)) },
        userId: new Types.ObjectId(userId),
        read: false,
      },
      {
        read: true,
        readAt: new Date(),
      }
    );

    if (result.modifiedCount > 0) {
      // Emit updated unread count
      const unreadCount = await this.getUnreadCount(userId);
      socketServer.emitToUser(userId, 'notification:unread-count', unreadCount);
      
      // Emit read status updates
      notificationIds.forEach(id => {
        socketServer.emitToUser(userId, 'notification:read', id);
      });
    }

    return result.modifiedCount;
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<number> {
    await connectToDatabase();

    const result = await Notification.updateMany(
      {
        userId: new Types.ObjectId(userId),
        read: false,
      },
      {
        read: true,
        readAt: new Date(),
      }
    );

    if (result.modifiedCount > 0) {
      // Emit updated unread count (should be 0)
      socketServer.emitToUser(userId, 'notification:unread-count', 0);
      socketServer.emitToUser(userId, 'notification:all-read', true);
    }

    return result.modifiedCount;
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    await connectToDatabase();

    const result = await Notification.deleteOne({
      _id: new Types.ObjectId(notificationId),
      userId: new Types.ObjectId(userId),
    });

    if (result.deletedCount > 0) {
      // Emit deletion event
      socketServer.emitToUser(userId, 'notification:deleted', notificationId);
      
      // Update unread count
      const unreadCount = await this.getUnreadCount(userId);
      socketServer.emitToUser(userId, 'notification:unread-count', unreadCount);
      
      return true;
    }

    return false;
  }

  /**
   * Delete multiple notifications
   */
  async deleteMultipleNotifications(notificationIds: string[], userId: string): Promise<number> {
    await connectToDatabase();

    const result = await Notification.deleteMany({
      _id: { $in: notificationIds.map(id => new Types.ObjectId(id)) },
      userId: new Types.ObjectId(userId),
    });

    if (result.deletedCount > 0) {
      // Emit deletion events
      notificationIds.forEach(id => {
        socketServer.emitToUser(userId, 'notification:deleted', id);
      });
      
      // Update unread count
      const unreadCount = await this.getUnreadCount(userId);
      socketServer.emitToUser(userId, 'notification:unread-count', unreadCount);
    }

    return result.deletedCount;
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    await connectToDatabase();

    return Notification.countDocuments({
      userId: new Types.ObjectId(userId),
      read: false,
    });
  }

  /**
   * Clean up old notifications (e.g., older than 30 days)
   */
  async cleanupOldNotifications(daysToKeep: number = 30): Promise<number> {
    await connectToDatabase();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await Notification.deleteMany({
      createdAt: { $lt: cutoffDate },
      read: true, // Only delete read notifications
    });

    console.log(`Cleaned up ${result.deletedCount} old notifications`);
    return result.deletedCount;
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

// Export class for testing
export default NotificationService;