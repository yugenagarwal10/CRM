import mongoose, { Schema, Document } from 'mongoose';

export type ActivityType =
  | 'lead_created'
  | 'status_changed'
  | 'reminder_created'
  | 'call'
  | 'email'
  | 'meeting'
  | 'note'
  | 'other';

export interface IActivity extends Document {
  leadId: mongoose.Types.ObjectId;
  type: ActivityType;
  title: string;
  description?: string;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const ActivitySchema = new Schema<IActivity>(
  {
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead', required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    type: {
      type: String,
      enum: [
        'lead_created',
        'status_changed',
        'reminder_created',
        'call',
        'email',
        'meeting',
        'note',
        'other',
      ],
      required: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Index to search activities of a lead quickly sorted by date
ActivitySchema.index({ leadId: 1, createdAt: -1 });

export const Activity = mongoose.model<IActivity>('Activity', ActivitySchema);
