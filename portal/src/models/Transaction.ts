import { Schema, model, models, Types } from 'mongoose';

const TransactionSchema = new Schema(
  {
    statement: { type: Types.ObjectId, ref: 'Statement', required: true, index: true },
    txnDate: { type: Date, required: true, index: true },
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    direction: { type: String, enum: ['debit', 'credit'], required: true, index: true },
    checkNo: { type: String },
    balance: { type: Number },
    category: { type: String },
    confidence: { type: Number, min: 0, max: 1 },
  },
  { timestamps: true }
);

TransactionSchema.index({ txnDate: 1, amount: -1 });

export const Transaction = models.Transaction || model('Transaction', TransactionSchema);


