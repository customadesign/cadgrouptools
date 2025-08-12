import { Schema, model, models } from 'mongoose';

const AddressSchema = new Schema(
  {
    line1: { type: String },
    line2: { type: String },
    city: { type: String },
    state: { type: String },
    country: { type: String },
    postalCode: { type: String },
  },
  { _id: false }
);

const ClientSchema = new Schema(
  {
    organization: { type: String, required: true, index: true },
    website: { type: String, index: true },
    industry: { type: String },
    address: { type: AddressSchema },
    email: { type: String },
    phone: { type: String },
  },
  { timestamps: true }
);

ClientSchema.index({ organization: 1, website: 1 });

export const Client = models.Client || model('Client', ClientSchema);


