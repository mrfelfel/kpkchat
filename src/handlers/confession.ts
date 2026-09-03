import TelegramBot from 'node-telegram-bot-api';
import { Response, HandlerContext } from '../types.js';
import { Confession } from '../models/confession.js';
import { kb } from '../keyboards.js';
import { redisHelpers } from '../config.js';
import { goHome } from './start.js';

const CONFESSION_CHANNEL_ID = process.env.CONFESSION_CHANNEL_ID;

export async function handleConfessionStart(
  ctx: HandlerContext,
  type: 'confession' | 'question'
): Promise<Response> {
  const uid = ctx.msg.from!.id;
  await redisHelpers.setUserLocation(uid, 'confession');
  await redisHelpers.setUserStep(uid, type === 'confession' ? 'write_confession' : 'write_question');

  const label = type === 'confession' ? 'اعتراف' : 'سوال';
  return {
    message: `متن ${label} ناشنست رو بنویس:`,
    options: {
      reply_to_message_id: ctx.msg.message_id,
      reply_markup: kb.confession(),
    },
    location: 'confession',
  };
}

export async function handleConfessionSubmit(ctx: HandlerContext): Promise<Response> {
  const { msg } = ctx;
  const uid = msg.from!.id;
  const step = await redisHelpers.getUserStep(uid);
  const type = step === 'write_confession' ? 'confession' as const : 'question' as const;
  const text = msg.text!;

  if (!text || text === '❌ انصراف') {
    return goHome(ctx);
  }

  if (text.length < 5) {
    return { message: 'متن خیلی کوتاهه! حداقل ۵ کاراکتر بنویس.' };
  }

  try {
    await Confession.create({ userId: uid, type, text });

    if (CONFESSION_CHANNEL_ID) {
      const emoji = type === 'confession' ? '💬' : '❓';
      const title = type === 'confession' ? 'اعتراف ناشناس' : 'سوال ناشناس';
      await ctx.bot.sendMessage(CONFESSION_CHANNEL_ID, `${emoji} ${title}:\n\n${text}`);
    }

    const label = type === 'confession' ? 'اعترافت' : 'سوالت';
    return {
      message: `${label} ثبت شد و به کانال ارسال شد! 🎉`,
      options: { reply_markup: kb.home() },
      location: 'home',
    };
  } catch (error) {
    console.error('Error submitting confession:', error);
    return {
      message: 'خطایی رخ داد. دوباره تلاش کن.',
      options: { reply_markup: kb.home() },
      location: 'home',
    };
  }
}
