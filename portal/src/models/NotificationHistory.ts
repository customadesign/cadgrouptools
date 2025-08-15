import { Schema, model, models } from 'mongoose';

export interface INotificationHistory {
  userId?: string;
  type: 'user_registration' | 'report_complete' | 'login_attempt' | 'system_alert' | 'custom';
  title: string;
  body: string;
  data?: Record<string, any>;
  sentTo: string[]; // Array of user IDs
  successCount: number;
  failureCount: number;
  failures?: Array<{
    userId: string;
    error: string;
  }>;
  createdAt?: Date;
  sentBy?: string; // Admin user ID who sent custom notification
}

const NotificationHistorySchema = new Schema<INotificationHistory>(
  {
    userId: { 
      type: String,
      index: true 
    },
    type: { 
      type: String, 
      enum: ['user_registration', 'report_complete', 'login_attempt', 'system_alert', 'custom'],
      required: true,
      index: true
    },
    title: { 
      type: String, 
      required: true 
    },
    body: { 
      type: String, 
      required: true 
    },
    data: { 
      type: Schema.Types.Mixed 
    },
    sentTo: [{ 
      type: String 
    }],
    successCount: { 
      type: Number, 
      default: 0 
    },
    failureCount: { 
      type: Number, 
      default: 0 
    },
    failures: [{
      userId: String,
      error: String
    }],
    sentBy: { 
      type: String 
    },
  },
  { 
    timestamps: true 
  }
);

// Index for efficient queries
NotificationHistorySchema.index({ createdAt: -1 });
NotificationHistorySchema.index({ type: 1, createdAt: -1 });

const NotificationHistory = models.NotificationHistory || model('NotificationHistory', NotificationHistorySchema);

export default NotificationHistory;