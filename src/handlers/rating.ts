import TelegramBot from 'node-telegram-bot-api';
import { Response, HandlerContext } from '../types.js';
import { User } from '../models/user.js';
import { kb } from '../keyboards.js';
import { redisHelpers } from '../config.js';
import { goHome } from './start.js';

const STAR_MAP: Record<string, number> = {
  '⭐': 1,
  '⭐⭐': 2,
  '⭐⭐⭐': 3,
  '⭐⭐⭐⭐': 4,
  '⭐⭐⭐⭐⭐': 5,
};

async function rateUser(telegramId: number, score: number) {
  const user = await User.findOne({ TelegramBotnumber: telegramId });
  if (!user) return;

  const newSum = (user.ratingSum || 0) + score;
  const newCount = (user.totalRatings || 0) + 1;
  const newAvg = Math.round((newSum / newCount) * 10) / 10;

  await User.findOneAndUpdate(
    { TelegramBotnumber: telegramId },
    { $set: { rating: newAvg, totalRatings: newCount, ratingSum: newSum } }
  );
}

export async function handleCloseChat(
  ctx: HandlerContext,
  bot: TelegramBot
): Promise<Response> {
  const { user, msg } = ctx;
  const uid = msg.from!.id;
  const partnerId = user?.partnerid;

  await User.findOneAndUpdate({ TelegramBotnumber: uid }, { $set: { status: 'joined' } });

  if (partnerId && partnerId !== 'no') {
    await User.findOneAndUpdate({ TelegramBotnumber: Number(partnerId) }, { $set: { status: 'joined' } });

    await bot.sendMessage(Number(partnerId), 'مکالمه شما پایان یافت.');
    await bot.sendMessage(Number(partnerId), 'به مخاطبت امتیاز بده:', {
      reply_markup: kb.rate(),
    });
    await redisHelpers.setUserLocation(Number(partnerId), 'rating');
    await redisHelpers.setUserStep(Number(partnerId), 'rate_partner');
  }

  await redisHelpers.setUserLimit(uid);

  return {
    message: 'مکالمه پایان یافت. به مخاطبت امتیاز بده:',
    options: { reply_markup: kb.rate() },
    location: 'rating',
  };
}

export async function handleRating(ctx: HandlerContext): Promise<Response> {
  const { user, msg } = ctx;
  const uid = msg.from!.id;
  const score = STAR_MAP[msg.text!];

  if (!score) {
    return {
      message: 'لطفا یکی از گزینه‌های امتیاز رو انتخاب کن.',
      options: { reply_markup: kb.rate() },
    };
  }

  const partnerId = user?.partnerid;
  if (partnerId && partnerId !== 'no') {
    await rateUser(Number(partnerId), score);
  }

  await User.findOneAndUpdate({ TelegramBotnumber: uid }, { $set: { partnerid: 'no' } });

  return goHome(ctx);
}
