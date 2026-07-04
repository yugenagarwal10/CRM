import mongoose, { Schema, Document } from 'mongoose';

export interface ISource extends Document {
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const SourceSchema = new Schema<ISource>(
  {
    name: { type: String, required: true, unique: true, trim: true },
  },
  { timestamps: true }
);

export const Source = mongoose.model<ISource>('Source', SourceSchema);
