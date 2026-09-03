import mongoose, { Schema, Document } from 'mongoose';

export interface IChat extends Document {
  from: number;
  to: number;
  chat: string;
  createdAt: Date;
}

const chatSchema = new Schema<IChat>({
  from: { type: Number, required: true, index: true },
  to: { type: Number, required: true, index: true },
  chat: { type: String, required: true },
}, { timestamps: true });

chatSchema.index({ from: 1, to: 1, createdAt: -1 });

export const Chat = mongoose.model<IChat>('chats', chatSchema);
