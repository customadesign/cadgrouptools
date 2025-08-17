import { Schema, model, models, Types } from 'mongoose';

export interface INotification {
  _id?: Types.ObjectId;
  userId: Types.ObjectId;
  type: 'user_registration' | 'statement_upload' | 'proposal_creation' | 'system' | 'info';
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  readAt?: Date;
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string;
  createdBy?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true, 
      index: true 
    },
    type: { 
      type: String, 
      enum: ['user_registration', 'statement_upload', 'proposal_creation', 'system', 'info'],
      required: true,
      index: true
    },
    title: { 
      type: String, 
      required: true 
    },
    message: { 
      type: String, 
      required: true 
    },
    data: { 
      type: Schema.Types.Mixed,
      default: {}
    },
    read: { 
      type: Boolean, 
      default: false,
      index: true
    },
    readAt: { 
      type: Date 
    },
    priority: { 
      type: String, 
      enum: ['low', 'medium', 'high'],
      default: 'medium',
      index: true
    },
    actionUrl: { 
      type: String 
    },
    createdBy: { 
      type: Schema.Types.ObjectId, 
      ref: 'User' 
    },
  },
  { 
    timestamps: true 
  }
);

// Compound indexes for efficient queries
NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, type: 1, createdAt: -1 });
NotificationSchema.index({ createdAt: -1 });

// Method to mark as read
NotificationSchema.methods.markAsRead = async function() {
  this.read = true;
  this.readAt = new Date();
  return this.save();
};

const Notification = models.Notification || model<INotification>('Notification', NotificationSchema);

export default Notification;