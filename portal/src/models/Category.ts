import { Schema, model, models, Types } from 'mongoose';

const CategorySchema = new Schema(
  {
    name: { type: String, required: true, index: true },
    type: { 
      type: String, 
      enum: ['income', 'expense', 'transfer'],
      required: true,
      index: true
    },
    parentCategory: { 
      type: Types.ObjectId, 
      ref: 'Category',
      default: null,
      index: true
    },
    description: { type: String },
    isDeductible: { 
      type: Boolean, 
      default: true 
    }, // For Philippine tax compliance
    birCategory: { type: String }, // For future BIR mapping (e.g., "2307", "2306")
    isSystem: { 
      type: Boolean, 
      default: false 
    }, // Prevent deletion of default categories
    icon: { type: String }, // Icon identifier (e.g., "ShopOutlined", "HomeOutlined")
    sortOrder: { type: Number, default: 0 },
    status: { 
      type: String, 
      enum: ['active', 'inactive'],
      default: 'active',
      index: true
    },
  },
  { timestamps: true }
);

// Compound indexes
CategorySchema.index({ type: 1, status: 1, sortOrder: 1 });
CategorySchema.index({ parentCategory: 1, sortOrder: 1 });
CategorySchema.index({ name: 1, type: 1 }, { unique: true });

export const Category = models.Category || model('Category', CategorySchema);


