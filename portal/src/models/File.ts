import { Schema, model, models, Types } from 'mongoose';

const FileSchema = new Schema(
  {
    // Legacy S3 fields (kept for backward compatibility)
    bucketKey: { type: String, index: true },
    sha256: { type: String, index: true },
    sizeBytes: { type: Number },
    
    // Common fields
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    uploadedBy: { type: Types.ObjectId, ref: 'User', required: true },
    
    // Storage provider fields
    storageProvider: { 
      type: String, 
      enum: ['s3', 'supabase', 'local'], 
      default: 'supabase',
      required: true 
    },
    url: { type: String, required: true },
    
    // Supabase specific fields
    bucket: { type: String },
    path: { type: String },
    
    // Metadata
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

// Add indexes
FileSchema.index({ uploadedBy: 1, createdAt: -1 });
FileSchema.index({ storageProvider: 1, path: 1 });

// Virtual for size compatibility
FileSchema.virtual('sizeBytes').get(function() {
  return this.size || this.sizeBytes;
});

export const File = models.File || model('File', FileSchema);


