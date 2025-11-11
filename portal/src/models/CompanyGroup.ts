import { Schema, model, models, Types } from 'mongoose';

const CompanyGroupSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, index: true },
    description: { type: String },
    companies: [{ 
      type: Types.ObjectId, 
      ref: 'Company',
      required: true 
    }],
    status: { 
      type: String, 
      enum: ['active', 'inactive'],
      default: 'active',
      index: true
    },
  },
  { timestamps: true }
);

// Indexes
CompanyGroupSchema.index({ status: 1, name: 1 });

export const CompanyGroup = models.CompanyGroup || model('CompanyGroup', CompanyGroupSchema);


