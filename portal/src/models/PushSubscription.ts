import { Schema, model, models } from 'mongoose';

export interface IPushSubscription {
  userId: string;
  subscription: {
    endpoint: string;
    expirationTime?: number | null;
    keys: {
      p256dh: string;
      auth: string;
    };
  };
  userAgent?: string;
  createdAt?: Date;
  updatedAt?: Date;
  lastUsed?: Date;
  isActive: boolean;
}

const PushSubscriptionSchema = new Schema<IPushSubscription>(
  {
    userId: { 
      type: String, 
      required: true, 
      index: true 
    },
    subscription: {
      endpoint: { 
        type: String, 
        required: true,
        unique: true 
      },
      expirationTime: { 
        type: Number, 
        default: null 
      },
      keys: {
        p256dh: { 
          type: String, 
          required: true 
        },
        auth: { 
          type: String, 
          required: true 
        },
      },
    },
    userAgent: { 
      type: String 
    },
    lastUsed: { 
      type: Date 
    },
    isActive: { 
      type: Boolean, 
      default: true 
    },
  },
  { 
    timestamps: true 
  }
);

// Index for efficient queries
PushSubscriptionSchema.index({ userId: 1, isActive: 1 });
// Note: subscription.endpoint already has an index from the unique: true constraint

const PushSubscription = models.PushSubscription || model('PushSubscription', PushSubscriptionSchema);

export default PushSubscription;