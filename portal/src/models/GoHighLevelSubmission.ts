import { Schema, model, models } from 'mongoose';

const GoHighLevelSubmissionSchema = new Schema(
  {
    formId: { type: String, required: true, index: true },
    formName: { type: String },
    submissionData: { type: Schema.Types.Mixed, required: true },
    company: { 
      type: String, 
      required: true,
      enum: ['murphy', 'esystems'],
      index: true
    },
    manusTaskId: { 
      type: String,
      index: true
    },
    proposalId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Proposal',
      index: true
    },
    status: { 
      type: String, 
      required: true,
      enum: ['received', 'processing', 'completed', 'failed'],
      default: 'received',
      index: true
    },
    errorMessage: { type: String },
    clientEmail: { type: String },
    clientOrganization: { type: String },
    webhookPayload: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

// Compound indexes for efficient queries
GoHighLevelSubmissionSchema.index({ company: 1, status: 1, createdAt: -1 });
GoHighLevelSubmissionSchema.index({ formId: 1, createdAt: -1 });

const GoHighLevelSubmission = models.GoHighLevelSubmission || model('GoHighLevelSubmission', GoHighLevelSubmissionSchema);

export default GoHighLevelSubmission;

