import TelegramBot from 'node-telegram-bot-api';
import { IUser } from './models/user.js';

export interface Response {
  message?: string;
  options?: Record<string, any>;
  location?: string;
}

export interface HandlerContext {
  bot: TelegramBot;
  msg: TelegramBot.Message;
  user: IUser | null;
  location: string;
  step: string | null;
}
