import 'dotenv/config';
import TelegramBot from 'node-telegram-bot-api';
import connectDB from './db.js';
import { redis, redisHelpers } from './config.js';
import { User } from './models/user.js';
import { kb } from './keyboards.js';
import * as start from './handlers/start.js';
import { handleSearch, handleMainSearch } from './handlers/search.js';
import { handleChatInput } from './handlers/chat.js';
import { handleCloseChat, handleRating } from './handlers/rating.js';
import { handleConfessionStart, handleConfessionSubmit } from './handlers/confession.js';

// ── Init ─────────────────────────────────────────────────

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, { polling: true });

(async () => {
  await redis.connect();
  await connectDB();
  console.log('✅ KPKChat bot running');
})();

// ── Bot commands ─────────────────────────────────────────

bot.setMyCommands([
  { command: 'start', description: 'شروع / بازگشت به منوی اصلی' },
]);

// ── Main message handler ─────────────────────────────────

bot.on('message', async (msg) => {
  try {
    const uid = msg.from!.id;
    const text = msg.text;

    const user = await User.findOne({ TelegramBotnumber: uid });
    let location = (await redisHelpers.getUserLocation(uid)) || 'home';
    const step = await redisHelpers.getUserStep(uid);

    let response: { message?: string; options?: any; location?: string } | null = null;

    // ── Global text commands ──
    if (text) {
      if (/\/start/.test(text)) {
        response = await start.handleStart({ bot, msg, user, location, step });
      } else if (/🔗 وصلم کن!/.test(text)) {
        response = await handleSearch({ bot, msg, user, location, step });
      } else if (/🏠 منوی اصلی/.test(text)) {
        response = start.goHome({ bot, msg, user, location, step });
      } else if (/🛑 قطع مکالمه/.test(text)) {
        response = await handleCloseChat({ bot, msg, user, location, step }, bot);
      } else if (/👤 مشخصات من/.test(text)) {
        response = handleProfile(user, msg);
      } else if (/💬 اعتراف ناشناس/.test(text)) {
        response = await handleConfessionStart({ bot, msg, user, location, step }, 'confession');
      } else if (/❓ سوال ناشناس/.test(text)) {
        response = await handleConfessionStart({ bot, msg, user, location, step }, 'question');
      } else if (/✏️ تغییر مشخصات/.test(text)) {
        await redisHelpers.setUserStep(uid, 'setgender');
        response = {
          message: 'جنسیت خود را انتخاب کنید',
          options: { reply_to_message_id: msg.message_id, reply_markup: kb.gender() },
          location: 'setup',
        };
      } else if (/🎯 تغییر علاقه‌مندی‌ها/.test(text)) {
        const current = user?.interests || [];
        await redisHelpers.setSelectedInterests(uid, [...current]);
        await redisHelpers.setUserStep(uid, 'setinterests');
        response = {
          message: 'علاقه‌مندی‌هات رو تغییر بده:',
          options: { reply_to_message_id: msg.message_id, reply_markup: kb.interests(current) },
          location: 'setup',
        };
      }
    }

    // Update location
    if (response?.location) {
      await redisHelpers.setUserLocation(uid, response.location);
      location = response.location;
    }

    // ── State machine ──
    if (location === 'home') {
      if (!response) response = start.goHome({ bot, msg, user, location, step });
    } else if (location === 'setup') {
      if (step === 'setgender') {
        response = await start.handleGenderSelection({ bot, msg, user, location, step });
      } else if (step === 'setinterests') {
        if (text === '✔️ تایید') {
          response = await start.handleInterestsConfirm({ bot, msg, user, location, step });
        } else if (text) {
          response = await start.handleInterestToggle({ bot, msg, user, location, step });
        }
      }
    } else if (location === 'search') {
      if (step === 'main_search') {
        response = await handleMainSearch({ bot, msg, user, location, step }, bot);
      } else if (step === 'input_send') {
        await handleChatInput({ bot, msg, user, location, step }, bot);
      } else if (step === 'setgender') {
        response = await start.handleGenderSelection({ bot, msg, user, location, step });
      }
    } else if (location === 'rating') {
      response = await handleRating({ bot, msg, user, location, step });
    } else if (location === 'confession') {
      if (step === 'write_confession' || step === 'write_question') {
        response = await handleConfessionSubmit({ bot, msg, user, location, step });
      }
    }

    // Send
    if (response?.message) {
      await bot.sendMessage(uid, response.message, response.options || {});
    }
  } catch (error) {
    console.error('Error handling message:', error);
    try {
      await bot.sendMessage(msg.from!.id, 'خطایی رخ داد. /start رو بزن.');
    } catch (e) {
      console.error('Error sending error msg:', e);
    }
  }
});

// ── Helpers ──────────────────────────────────────────────

function handleProfile(user: any, msg: TelegramBot.Message) {
  const gender = user?.gender === 'female' ? '👩🏻 دختر' : '👨🏻 پسر';
  const interests = user?.interests?.length > 0 ? user.interests.join('، ') : 'ندارد';
  const rating = user?.totalRatings > 0
    ? `${user.rating} ⭐ (${user.totalRatings} رأی)`
    : 'بدون امتیاز';

  return {
    message: [
      '👤 مشخصات شما:',
      '━━━━━━━━━━━━━━',
      `📝 نام: ${user?.name}`,
      `⚥ جنسیت: ${gender}`,
      `🎯 علاقه‌مندی‌ها: ${interests}`,
      `⭐ امتیاز: ${rating}`,
    ].join('\n'),
    options: {
      reply_to_message_id: msg.message_id,
      reply_markup: kb.profile(),
    },
  };
}

// ── Broadcast ────────────────────────────────────────────

export async function sendToAllUsers() {
  const allUsers = await User.find({ status: 'joined', TelegramBotnumber: { $ne: null } });
  for (const user of allUsers) {
    try {
      await bot.sendMessage(user.TelegramBotnumber, '🔗 دنبال یه گفتگوی ناشناس هستی؟ همین الان شروع کن!');
      await new Promise((r) => setTimeout(r, 100));
    } catch (e: any) {
      console.error(`Error sending to ${user.TelegramBotnumber}:`, e.message);
    }
  }
  console.log(`✅ Broadcast sent to ${allUsers.length} users`);
}

// ── Error handling ───────────────────────────────────────

bot.on('polling_error', (err) => console.error('Polling error:', err));
process.on('unhandledRejection', (err) => console.error('Unhandled rejection:', err));
process.on('SIGINT', async () => {
  console.log('Shutting down...');
  await redis.quit();
  process.exit(0);
});
