import mongoose, { Schema, Document } from 'mongoose';

export interface IConfession extends Document {
  userId: number;
  type: 'confession' | 'question';
  text: string;
  createdAt: Date;
}

const confessionSchema = new Schema<IConfession>({
  userId: { type: Number, required: true, index: true },
  type: { type: String, enum: ['confession', 'question'], required: true },
  text: { type: String, required: true },
}, { timestamps: true });

export const Confession = mongoose.model<IConfession>('confessions', confessionSchema);
