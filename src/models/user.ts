import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  username: string;
  TelegramBotnumber: number;
  status: 'joined' | 'searching' | 'chatting' | 'blocked';
  gender: 'male' | 'female' | 'other';
  city?: string;
  partnerid: string;
  interests: string[];
  rating: number;
  totalRatings: number;
  ratingSum: number;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  name: { type: String, required: true },
  username: { type: String, required: true, lowercase: true, index: true },
  TelegramBotnumber: { type: Number, required: true, unique: true, index: true },
  status: { type: String, enum: ['joined', 'searching', 'chatting', 'blocked'], default: 'joined' },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  city: String,
  partnerid: { type: String, default: 'no' },
  interests: { type: [String], default: [] },
  rating: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 },
  ratingSum: { type: Number, default: 0 },
}, { timestamps: true });

userSchema.index({ status: 1, TelegramBotnumber: 1 });

export const User = mongoose.model<IUser>('users', userSchema);

export const AVAILABLE_INTERESTS = [
  'موسیقی', 'فیلم', 'کتاب', 'ورزش', 'بازی',
  'برنامه‌نویسی', 'هنر', 'آشپزی', 'سفر', 'عکاسی',
  'علم', 'تکنولوژی', 'فلسفه', 'تاریخ', 'طبیعت',
];
