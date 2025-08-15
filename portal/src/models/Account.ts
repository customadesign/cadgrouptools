import { Schema, model, models } from 'mongoose';

const AccountSchema = new Schema(
  {
    name: { type: String, required: true, index: true },
    bankName: { type: String, required: true },
    accountNumber: { type: String }, // Last 4 digits only for security
    currency: { type: String, default: 'USD' },
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

// Compound index for unique account identification
AccountSchema.index({ name: 1, bankName: 1 });

export const Account = models.Account || model('Account', AccountSchema);
