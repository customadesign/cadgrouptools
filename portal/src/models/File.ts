import mongoose, { Schema, Document } from 'mongoose';

export interface IFile extends Document {
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  path: string;
  storageProvider: 'supabase' | 'local';
  uploadedBy: mongoose.Types.ObjectId;
  uploadedAt: Date;
  updatedAt: Date;
  // Metadata fields
  description?: string;
  tags?: string[];
  // File processing status
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  processingErrors?: string[];
  // OCR results (if applicable)
  ocrText?: string;
  ocrConfidence?: number;
  ocrProvider?: string;
}

const FileSchema = new Schema<IFile>({
  originalName: {
    type: String,
    required: true,
    trim: true
  },
  fileName: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  mimeType: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true,
    min: 0
  },
  path: {
    type: String,
    required: true,
    trim: true
  },
  storageProvider: {
    type: String,
    enum: ['supabase', 'local'],
    default: 'supabase',
    required: true
  },
  uploadedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  description: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  processingStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  processingErrors: [{
    type: String
  }],
  ocrText: {
    type: String
  },
  ocrConfidence: {
    type: Number,
    min: 0,
    max: 1
  },
  ocrProvider: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes for performance
FileSchema.index({ uploadedBy: 1, uploadedAt: -1 });
FileSchema.index({ storageProvider: 1 });
FileSchema.index({ processingStatus: 1 });
FileSchema.index({ mimeType: 1 });
FileSchema.index({ tags: 1 });

// Update the updatedAt field on save
FileSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const File = mongoose.models.File || mongoose.model<IFile>('File', FileSchema);


