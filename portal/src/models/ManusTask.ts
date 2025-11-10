import { Schema, model, models } from 'mongoose';

const WebhookEventSchema = new Schema({
  timestamp: { type: Date, default: Date.now },
  status: { type: String },
  data: { type: Schema.Types.Mixed }
}, { _id: false });

const ManusTaskSchema = new Schema(
  {
    manusTaskId: { type: String, required: true, unique: true, index: true },
    taskType: { 
      type: String, 
      required: true,
      enum: ['proposal_murphy', 'proposal_esystems', 'accounting'],
      index: true
    },
    company: { 
      type: String,
      enum: [
        'murphy_web_services',
        'esystems_management',
        'mm_secretarial',
        'dpm',
        'linkage_web_solutions',
        'wdds',
        'mm_leasing',
        'hardin_bar_grill',
        'mphi'
      ]
    },
    status: { 
      type: String, 
      required: true,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
      index: true
    },
    inputData: { type: Schema.Types.Mixed },
    outputData: { type: Schema.Types.Mixed },
    webhookEvents: [WebhookEventSchema],
    proposalId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Proposal',
      index: true
    },
    accountingUploadId: { 
      type: Schema.Types.ObjectId, 
      ref: 'AccountingDocument',
      index: true
    },
  },
  { timestamps: true }
);

// Compound indexes for efficient queries
ManusTaskSchema.index({ taskType: 1, status: 1, createdAt: -1 });
ManusTaskSchema.index({ company: 1, taskType: 1 });

const ManusTask = models.ManusTask || model('ManusTask', ManusTaskSchema);

export default ManusTask;

