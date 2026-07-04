import mongoose, { Schema, Document } from 'mongoose';

export interface IStatus extends Document {
  name: string;
  color: string; // Tailwind color keyword (e.g. 'indigo', 'emerald', 'rose', 'amber', 'purple', 'blue', 'zinc')
  order: number;
  type: 'standard' | 'won' | 'lost';
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const StatusSchema = new Schema<IStatus>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    color: { type: String, default: 'indigo' },
    order: { type: Number, required: true, default: 0 },
    type: { type: String, enum: ['standard', 'won', 'lost'], default: 'standard' },
    isSystem: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Status = mongoose.model<IStatus>('Status', StatusSchema);
