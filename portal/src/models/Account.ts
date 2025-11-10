import { Schema, model, models, Types } from 'mongoose';

const AccountSchema = new Schema(
  {
    company: { 
      type: Types.ObjectId, 
      ref: 'Company', 
      required: true, 
      index: true 
    },
    name: { type: String, required: true, index: true },
    bankName: { type: String, required: true },
    accountNumber: { type: String }, // Last 4 digits only for security
    currency: { type: String, default: 'PHP' },
    type: { 
      type: String, 
      enum: ['checking', 'savings', 'credit', 'investment'],
      default: 'checking'
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'closed'],
      default: 'active'
    },
    lastImportedAt: { type: Date },
    balance: { type: Number, default: 0 },
    notes: { type: String },
  },
  { timestamps: true }
);

// Compound indexes for unique account identification and queries
AccountSchema.index({ name: 1, bankName: 1 });
AccountSchema.index({ company: 1, name: 1, bankName: 1 });
AccountSchema.index({ company: 1, status: 1 });

export const Account = models.Account || model('Account', AccountSchema);
