import { Schema, model, models } from 'mongoose';

const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'staff'], default: 'staff', index: true },
    lastLogin: { type: Date },
  },
  { timestamps: true }
);

export const User = models.User || model('User', UserSchema);


