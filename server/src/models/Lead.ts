import mongoose, { Schema, Document } from 'mongoose';

export type LeadStatus = string;

export interface ILead extends Document {
  name: string;
  company: string;
  email: string;
  phone: string;
  notes: string;
  status: LeadStatus;
  inactiveLimitDays: number;
  lastActivityAt: Date;
  nextFollowUpDate?: Date;
  referrerId?: mongoose.Types.ObjectId | null;
  source?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema = new Schema<ILead>(
  {
    name: { type: String, required: true, trim: true },
    company: { type: String, default: '', trim: true },
    email: { type: String, default: '', trim: true },
    phone: { type: String, default: '', trim: true },
    notes: { type: String, default: '' },
    status: {
      type: String,
      default: 'New',
    },
    inactiveLimitDays: { type: Number, default: 2 },
    lastActivityAt: { type: Date, default: Date.now },
    nextFollowUpDate: { type: Date },
    referrerId: { type: Schema.Types.ObjectId, ref: 'Referrer', default: null },
    source: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Lead = mongoose.model<ILead>('Lead', LeadSchema);
