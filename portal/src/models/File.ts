import { Schema, model, models, Types } from 'mongoose';

const FileSchema = new Schema(
  {
    bucketKey: { type: String, required: true, index: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    sha256: { type: String, required: true, index: true },
    uploadedBy: { type: Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const File = models.File || model('File', FileSchema);


