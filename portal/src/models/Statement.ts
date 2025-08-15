import { Schema, model, models, Types } from 'mongoose';

const StatementSchema = new Schema(
  {
    account: { type: Types.ObjectId, ref: 'Account', index: true },
    accountName: { type: String, required: true, index: true }, // Keep for backward compatibility
    bankName: { type: String },
    currency: { type: String, default: 'USD' },
    month: { type: Number, required: true, index: true },
    year: { type: Number, required: true, index: true },
    sourceFile: { type: Types.ObjectId, ref: 'File', required: true },
    pages: { type: Number },
    ocrProvider: { type: String, enum: ['textract', 'docai', 'tesseract', 'pdf-parse'], default: 'textract' },
    status: { type: String, enum: ['uploaded', 'queued', 'processing', 'extracted', 'needs_review', 'completed', 'failed'], default: 'uploaded', index: true },
    extractedData: {
      rawText: { type: String },
      parsedData: { type: Schema.Types.Mixed },
      confidence: { type: Number },
      message: { type: String },
    },
    extractedAt: { type: Date },
    processingErrors: [{ type: String }],
    createdBy: { type: Types.ObjectId, ref: 'User' },
    transactionsFound: { type: Number, default: 0 },
    transactionsImported: { type: Number, default: 0 },
  },
  { 
    timestamps: true
  }
);

StatementSchema.index({ account: 1, month: 1, year: 1 });
StatementSchema.index({ accountName: 1, month: 1, year: 1 });

export const Statement = models.Statement || model('Statement', StatementSchema);


