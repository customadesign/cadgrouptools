import { Schema, model, models } from 'mongoose';

export interface INotificationHistory {
  type: 'user_registration' | 'report_complete' | 'login_attempt' | 'system_alert' | 'custom';
  title: string;
  body: string;
  data?: Record<string, any>;
  sentTo: string[]; // User IDs
  successCount: number;
  failureCount: number;
  failures?: Array<{
    userId: string;
    error: string;
  }>;
  sentBy?: string; // User ID of sender (for custom notifications)
  createdAt?: Date;
}

const NotificationHistorySchema = new Schema<INotificationHistory>(
  {
    type: {
      type: String,
      enum: ['user_registration', 'report_complete', 'login_attempt', 'system_alert', 'custom'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    data: {
      type: Schema.Types.Mixed,
    },
    sentTo: [{
      type: String,
      required: true,
    }],
    successCount: {
      type: Number,
      default: 0,
    },
    failureCount: {
      type: Number,
      default: 0,
    },
    failures: [{
      userId: String,
      error: String,
    }],
    sentBy: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
NotificationHistorySchema.index({ type: 1, createdAt: -1 });
NotificationHistorySchema.index({ sentTo: 1, createdAt: -1 });
NotificationHistorySchema.index({ sentBy: 1, createdAt: -1 });

const NotificationHistory = models.NotificationHistory || model('NotificationHistory', NotificationHistorySchema);

export default NotificationHistory;