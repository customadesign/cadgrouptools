"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Client = void 0;
const mongoose_1 = require("mongoose");
const AddressSchema = new mongoose_1.Schema({
    line1: { type: String },
    line2: { type: String },
    city: { type: String },
    state: { type: String },
    country: { type: String },
    postalCode: { type: String },
}, { _id: false });
const ClientSchema = new mongoose_1.Schema({
    organization: { type: String, required: true, index: true },
    website: { type: String, index: true },
    industry: { type: String },
    address: { type: AddressSchema },
    email: { type: String },
    phone: { type: String },
    avatar: { type: String }, // URL to avatar image in Supabase storage
    // Additional fields for better client management
    firstName: { type: String },
    lastName: { type: String },
    jobTitle: { type: String },
    status: {
        type: String,
        enum: ['active', 'inactive', 'prospect'],
        default: 'active'
    },
    companySize: { type: String },
    notes: { type: String },
    leadSource: { type: String },
    estimatedValue: { type: Number, default: 0 },
    linkedin: { type: String },
    twitter: { type: String },
}, { timestamps: true });
ClientSchema.index({ organization: 1, website: 1 });
exports.Client = mongoose_1.models.Client || (0, mongoose_1.model)('Client', ClientSchema);
