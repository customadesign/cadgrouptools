import { Schema, model, models, Types } from 'mongoose';

const ReportSnapshotSchema = new Schema(
  {
    company: { 
      type: Types.ObjectId, 
      ref: 'Company',
      default: null, // null for consolidated reports
      index: true
    },
    reportType: { 
      type: String, 
      enum: [
        'pl', 
        'cashflow', 
        'expenses', 
        'revenue', 
        'transactions', 
        'consolidated_pl', 
        'company_comparison',
        'cash_position',
        'tax_summary',
        'uncategorized'
      ],
      required: true,
      index: true
    },
    period: {
      year: { type: Number, required: true },
      month: { type: Number, min: 1, max: 12 }, // Optional, for monthly reports
      quarter: { type: Number, min: 1, max: 4 }, // Optional, for quarterly reports
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
    },
    data: { type: Schema.Types.Mixed }, // JSON report data
    generatedAt: { type: Date, required: true, default: Date.now, index: true },
    generatedBy: { 
      type: Types.ObjectId, 
      ref: 'User',
      required: true
    },
  },
  { timestamps: true }
);

// Compound indexes for efficient lookups
ReportSnapshotSchema.index({ 
  company: 1, 
  reportType: 1, 
  'period.year': -1, 
  'period.month': -1 
});
ReportSnapshotSchema.index({ 
  reportType: 1, 
  generatedAt: -1 
});

export const ReportSnapshot = models.ReportSnapshot || model('ReportSnapshot', ReportSnapshotSchema);


