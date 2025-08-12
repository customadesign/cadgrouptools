import { Schema, model, models, Types } from 'mongoose';

const StatementSchema = new Schema(
  {
    accountName: { type: String, required: true, index: true },
    bankName: { type: String },
    currency: { type: String, default: 'USD' },
    month: { type: Number, required: true, index: true },
    year: { type: Number, required: true, index: true },
    sourceFile: { type: Types.ObjectId, ref: 'File', required: true },
    pages: { type: Number },
    ocrProvider: { type: String, enum: ['textract', 'docai', 'tesseract'], default: 'textract' },
    status: { type: String, enum: ['uploaded', 'queued', 'processing', 'extracted', 'needs_review', 'completed'], default: 'uploaded', index: true },
  },
  { timestamps: true }
);

StatementSchema.index({ accountName: 1, month: 1, year: 1 });

export const Statement = models.Statement || model('Statement', StatementSchema);


