import TelegramBot from 'node-telegram-bot-api';
import { Response, HandlerContext } from '../types.js';
import { User } from '../models/user.js';
import { kb } from '../keyboards.js';
import { redisHelpers } from '../config.js';

export async function handleSearch(ctx: HandlerContext): Promise<Response> {
  const { user, msg } = ctx;

  if (!user) {
    return { message: 'لطفا اول /start رو بزن.', location: 'home' };
  }

  if (!user.gender) {
    await redisHelpers.setUserStep(msg.from!.id, 'setgender');
    return {
      message: 'جنسیت خود را انتخاب کنید',
      options: {
        reply_to_message_id: msg.message_id,
        reply_markup: kb.gender(),
      },
      location: 'setup',
    };
  }

  await redisHelpers.setUserStep(msg.from!.id, 'main_search');
  return { location: 'search' };
}

export async function handleMainSearch(
  ctx: HandlerContext,
  bot: TelegramBot
): Promise<Response> {
  const { user, msg } = ctx;
  const uid = msg.from!.id;

  const userLimit = await redisHelpers.getUserLimit(uid);
  if (userLimit) {
    return { message: 'هر یک دقیقه یک بار میتونی جستجو کنی!' };
  }

  const searchUser = await findMatch(uid, user!.interests || []);
  await redisHelpers.incrSign(uid);

  if (searchUser) {
    const blocked = await redisHelpers.getUserBlock(uid, searchUser.TelegramBotnumber);
    if (!blocked) {
      const common = (user!.interests || []).filter((i) =>
        (searchUser.interests || []).includes(i)
      );

      await Promise.all([
        User.findOneAndUpdate({ TelegramBotnumber: uid }, { $set: { status: 'chatting', partnerid: searchUser.TelegramBotnumber } }),
        User.findOneAndUpdate({ TelegramBotnumber: searchUser.TelegramBotnumber }, { $set: { status: 'chatting', partnerid: uid } }),
        redisHelpers.setUserStep(uid, 'input_send'),
        redisHelpers.setUserStep(searchUser.TelegramBotnumber, 'input_send'),
      ]);

      const interestTag = common.length > 0 ? `\n🎯 علاقه مشترک: ${common.join('، ')}` : '';

      await bot.sendMessage(searchUser.TelegramBotnumber, `یافتم و وصلت کردم!${interestTag}`);

      return {
        message: `به یه نفر وصلت کردم! شروع کن.${interestTag}`,
        options: {
          reply_to_message_id: msg.message_id,
          reply_markup: kb.chat(),
        },
      };
    }
  }

  await User.findOneAndUpdate({ TelegramBotnumber: uid }, { $set: { status: 'searching', partnerid: 'no' } });

  return {
    message: 'در حال جستجو... لطفا صبر کن 🔄',
    options: {
      reply_to_message_id: msg.message_id,
      reply_markup: kb.chat(),
    },
  };
}

async function findMatch(uid: number, myInterests: string[]) {
  if (myInterests.length > 0) {
    const matchCount = await User.countDocuments({
      status: 'searching',
      TelegramBotnumber: { $ne: uid },
      interests: { $in: myInterests },
    });

    if (matchCount > 0) {
      const skip = Math.floor(Math.random() * matchCount);
      return await User.findOne({
        status: 'searching',
        TelegramBotnumber: { $ne: uid },
        interests: { $in: myInterests },
      }).skip(skip);
    }
  }

  const count = await User.countDocuments({
    status: 'searching',
    TelegramBotnumber: { $ne: uid },
  });

  if (count === 0) return null;

  const skip = Math.floor(Math.random() * count);
  return await User.findOne({
    status: 'searching',
    TelegramBotnumber: { $ne: uid },
  }).skip(skip);
}
