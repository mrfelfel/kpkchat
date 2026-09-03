import { Response, HandlerContext } from '../types.js';
import { User, AVAILABLE_INTERESTS } from '../models/user.js';
import { kb } from '../keyboards.js';
import { redisHelpers } from '../config.js';

export function goHome(ctx: HandlerContext): Response {
  return {
    message: 'خوش اومدی! چیکار برات انجام بدم؟',
    options: {
      reply_to_message_id: ctx.msg.message_id,
      reply_markup: kb.home(),
    },
    location: 'home',
  };
}

export async function handleStart(ctx: HandlerContext): Promise<Response> {
  const uid = ctx.msg.from!.id;

  let user = await User.findOne({ TelegramBotnumber: uid });
  if (!user) {
    user = await User.create({
      name: ctx.msg.from!.first_name,
      username: ctx.msg.from!.username || 'unknown',
      TelegramBotnumber: uid,
    });
  }

  if (!user.gender) {
    await redisHelpers.setUserStep(uid, 'setgender');
    return {
      message: 'قبل از هر چیز، جنسیت خود را انتخاب کن:',
      options: {
        reply_to_message_id: ctx.msg.message_id,
        reply_markup: kb.gender(),
      },
      location: 'setup',
    };
  }

  if (!user.interests || user.interests.length === 0) {
    await redisHelpers.setUserStep(uid, 'setinterests');
    await redisHelpers.setSelectedInterests(uid, []);
    return {
      message: 'چه موضوعاتی برات جالبه؟ چندتا انتخاب کن:',
      options: {
        reply_to_message_id: ctx.msg.message_id,
        reply_markup: kb.interests([]),
      },
      location: 'setup',
    };
  }

  return goHome(ctx);
}

export async function handleGenderSelection(ctx: HandlerContext): Promise<Response | null> {
  const text = ctx.msg.text;
  const uid = ctx.msg.from!.id;

  if (text === '👩🏻 دخترم') {
    await User.findOneAndUpdate({ TelegramBotnumber: uid }, { $set: { gender: 'female' } });
  } else if (text === '👨🏻 پسرم') {
    await User.findOneAndUpdate({ TelegramBotnumber: uid }, { $set: { gender: 'male' } });
  } else {
    return null;
  }

  await redisHelpers.setUserStep(uid, 'setinterests');
  await redisHelpers.setSelectedInterests(uid, []);

  return {
    message: 'عالی! حالا چه موضوعاتی برات جالبه؟',
    options: {
      reply_to_message_id: ctx.msg.message_id,
      reply_markup: kb.interests([]),
    },
    location: 'setup',
  };
}

export async function handleInterestToggle(ctx: HandlerContext): Promise<Response> {
  const raw = ctx.msg.text!;
  const text = raw.replace('✅ ', '').replace('☐ ', '');
  const uid = ctx.msg.from!.id;
  let selected = await redisHelpers.getSelectedInterests(uid);

  if (selected.includes(text)) {
    selected = selected.filter((i) => i !== text);
  } else {
    if (selected.length >= 5) {
      return { message: 'حداکثر ۵ تا موضوع میتونی انتخاب کنی!' };
    }
    selected.push(text);
  }

  await redisHelpers.setSelectedInterests(uid, selected);

  return {
    message: `انتخاب شده: ${selected.length > 0 ? selected.join('، ') : 'هیچ'}\nوقتی تموم شد «✔️ تایید» رو بزن.`,
    options: { reply_markup: kb.interests(selected) },
    location: 'setup',
  };
}

export async function handleInterestsConfirm(ctx: HandlerContext): Promise<Response> {
  const uid = ctx.msg.from!.id;
  const selected = await redisHelpers.getSelectedInterests(uid);
  await User.findOneAndUpdate({ TelegramBotnumber: uid }, { $set: { interests: selected } });
  await redisHelpers.clearSelectedInterests(uid);
  return goHome(ctx);
}
