import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IReminder extends Document {
  leadId: Types.ObjectId;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  note: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReminderSchema = new Schema<IReminder>(
  {
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead', required: true },
    title: { type: String, required: true, trim: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    note: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Reminder = mongoose.model<IReminder>('Reminder', ReminderSchema);
