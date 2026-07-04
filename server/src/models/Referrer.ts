import mongoose, { Schema, Document } from 'mongoose';

export interface IReferrer extends Document {
  name: string;
  email: string;
  phone: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReferrerSchema = new Schema<IReferrer>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    email: { type: String, default: '', trim: true },
    phone: { type: String, default: '', trim: true },
  },
  { timestamps: true }
);

export const Referrer = mongoose.model<IReferrer>('Referrer', ReferrerSchema);
