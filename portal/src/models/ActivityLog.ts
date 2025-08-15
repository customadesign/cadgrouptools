import { Schema, model, models } from 'mongoose';

export interface IActivityLog {
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  actionType: 'login' | 'logout' | 'create' | 'update' | 'delete' | 'view' | 'upload' | 'download' | 'generate' | 'export' | 'import' | 'error';
  resourceType: 'user' | 'client' | 'proposal' | 'report' | 'file' | 'transaction' | 'statement' | 'system' | 'auth';
  resourceId?: string;
  resourceName?: string;
  method: string;
  endpoint: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  success: boolean;
  errorMessage?: string;
  statusCode: number;
  responseTime?: number;
  metadata?: Record<string, any>;
  changes?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  };
  location?: {
    country?: string;
    city?: string;
    region?: string;
  };
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    // User information
    userId: { 
      type: String, 
      required: true,
      index: true 
    },
    userName: { 
      type: String, 
      required: true 
    },
    userEmail: { 
      type: String, 
      required: true,
      index: true 
    },
    userRole: { 
      type: String, 
      required: true,
      enum: ['admin', 'staff'],
      index: true 
    },
    
    // Action information
    actionType: { 
      type: String, 
      required: true,
      enum: ['login', 'logout', 'create', 'update', 'delete', 'view', 'upload', 'download', 'generate', 'export', 'import', 'error'],
      index: true 
    },
    
    // Resource information
    resourceType: { 
      type: String, 
      required: true,
      enum: ['user', 'client', 'proposal', 'report', 'file', 'transaction', 'statement', 'system', 'auth'],
      index: true 
    },
    resourceId: { 
      type: String,
      index: true 
    },
    resourceName: { 
      type: String 
    },
    
    // Request information
    method: { 
      type: String, 
      required: true,
      enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
    },
    endpoint: { 
      type: String, 
      required: true,
      index: true 
    },
    
    // Client information
    ipAddress: { 
      type: String, 
      required: true,
      index: true 
    },
    userAgent: { 
      type: String, 
      required: true 
    },
    
    // Timing and status
    timestamp: { 
      type: Date, 
      required: true,
      default: Date.now,
      index: true 
    },
    success: { 
      type: Boolean, 
      required: true,
      index: true 
    },
    errorMessage: { 
      type: String 
    },
    statusCode: { 
      type: Number, 
      required: true 
    },
    responseTime: { 
      type: Number // in milliseconds
    },
    
    // Additional data
    metadata: { 
      type: Schema.Types.Mixed 
    },
    changes: {
      before: { type: Schema.Types.Mixed },
      after: { type: Schema.Types.Mixed }
    },
    location: {
      country: { type: String },
      city: { type: String },
      region: { type: String }
    }
  },
  { 
    timestamps: false, // We're using our own timestamp field
    collection: 'activity_logs'
  }
);

// Compound indexes for common queries
ActivityLogSchema.index({ userId: 1, timestamp: -1 });
ActivityLogSchema.index({ resourceType: 1, resourceId: 1, timestamp: -1 });
ActivityLogSchema.index({ actionType: 1, timestamp: -1 });
ActivityLogSchema.index({ success: 1, timestamp: -1 });
ActivityLogSchema.index({ userRole: 1, actionType: 1, timestamp: -1 });

// Text index for searching
ActivityLogSchema.index({ 
  userName: 'text', 
  userEmail: 'text', 
  resourceName: 'text', 
  endpoint: 'text' 
});

// TTL index to auto-delete old logs after 90 days (optional, can be configured)
// Uncomment if you want automatic cleanup
// ActivityLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

const ActivityLog = models.ActivityLog || model<IActivityLog>('ActivityLog', ActivityLogSchema);

export default ActivityLog;