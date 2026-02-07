require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const redis = require('redis');
const users = require('./users');
const chats = require('./chat');

// Initialize bot
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

// Initialize Redis client with modern syntax
const client = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

// Connect Redis
(async () => {
  try {
    await client.connect();
    console.log('✅ Redis connected successfully');
  } catch (error) {
    console.error('❌ Redis connection failed:', error);
    process.exit(1);
  }
})();

// Redis error handling
client.on('error', (err) => console.error('Redis Client Error:', err));

// Redis helper functions
const redisHelpers = {
  setUserLocation: async (uid, location) => {
    await client.set(`location-${uid}`, location);
  },

  getUserLocation: async (uid) => {
    return await client.get(`location-${uid}`);
  },

  setUserStep: async (uid, step) => {
    await client.set(`step-${uid}`, step);
  },

  getUserStep: async (uid) => {
    return await client.get(`step-${uid}`);
  },

  setUserLimit: async (uid) => {
    await client.set(`limit-${uid}`, 'limited', { EX: 60 });
  },

  getUserLimit: async (uid) => {
    return await client.get(`limit-${uid}`);
  },

  incrSign: async (uid) => {
    return await client.incr(`signed-${uid}`);
  },

  setUserBlock: async (uid, pid) => {
    await client.set(`blocked-${uid}-${pid}`, 'blocked');
  },

  getUserBlock: async (uid, pid) => {
    let result = await client.get(`blocked-${uid}-${pid}`);
    if (!result) {
      result = await client.get(`blocked-${pid}-${uid}`);
    }
    return result;
  }
};

// UI helper functions
const uiHelpers = {
  getHomeKeyboard: () => ({
    resize_keyboard: true,
    keyboard: [
      [{ text: '🔗 به یه ناشناس وصلم کن!' }],
      [{ text: 'مشخصات من' }, { text: 'درباره بات' }, { text: 'عضویت طلایی' }]
    ]
  }),

  getChatKeyboard: () => ({
    resize_keyboard: true,
    keyboard: [['قطع مکالمه']]
  }),

  getGenderKeyboard: () => ({
    resize_keyboard: true,
    keyboard: [[{ text: 'دخترم 👩🏻' }, { text: 'پسرم👨🏻' }]]
  }),

  getBlockKeyboard: () => ({
    resize_keyboard: true,
    keyboard: [[{ text: 'اره' }, { text: 'نه' }]]
  }),

  getProfileKeyboard: () => ({
    resize_keyboard: true,
    keyboard: [[{ text: 'تغییر مشخصات' }], [{ text: 'منوی اصلی' }]]
  })
};

// Message handlers
const messageHandlers = {
  goHome: (msg) => {
    return {
      message: 'خوب چیکار باید بکنم ؟',
      options: {
        reply_to_message_id: msg.message_id,
        reply_markup: JSON.stringify(uiHelpers.getHomeKeyboard())
      },
      location: 'home'
    };
  },

  handleStart: async (msg) => {
    try {
      const userDetail = await users.getUser(msg.from.id);
      
      if (!userDetail) {
        await users.insert(
          msg.from.username || 'unknown',
          msg.from.first_name,
          msg.from.id
        );
      }
      
      return messageHandlers.goHome(msg);
    } catch (error) {
      console.error('Error in handleStart:', error);
      return messageHandlers.goHome(msg);
    }
  },

  handleSearch: async (msg, userDetail) => {
    if (!userDetail) {
      return {
        message: 'متاسفانه من هنوز تو رو نمیشناسم لطفا روی /start بزن',
        location: 'home'
      };
    }

    if (!userDetail.gender) {
      await redisHelpers.setUserStep(msg.from.id, 'setgender');
      return {
        message: 'جنسیت خود را انتخاب کنید',
        options: {
          reply_to_message_id: msg.message_id,
          reply_markup: JSON.stringify(uiHelpers.getGenderKeyboard())
        },
        location: 'search'
      };
    }

    await redisHelpers.setUserStep(msg.from.id, 'main_search');
    return { location: 'search' };
  },

  handleMainSearch: async (msg, userDetail) => {
    try {
      const userLimit = await redisHelpers.getUserLimit(msg.from.id);
      
      if (userLimit) {
        return {
          message: 'هر یک دقیقه یک بار میتونی جستجو کنی!'
        };
      }

      const searchUser = await users.randomSearch(msg.from.id);
      await redisHelpers.incrSign(msg.from.id);
      let chatFound = false;

      if (searchUser) {
        const userBlocked = await redisHelpers.getUserBlock(msg.from.id, searchUser.TelegramBotnumber);
        
        if (!userBlocked) {
          // Connect users
          await Promise.all([
            users.updateStatus(msg.from.id, 'chatting'),
            users.updateStatus(searchUser.TelegramBotnumber, 'chatting'),
            users.updatePartner(msg.from.id, searchUser.TelegramBotnumber),
            users.updatePartner(searchUser.TelegramBotnumber, msg.from.id),
            redisHelpers.setUserStep(msg.from.id, 'input_send'),
            redisHelpers.setUserStep(searchUser.TelegramBotnumber, 'input_send')
          ]);

          await bot.sendMessage(
            searchUser.TelegramBotnumber,
            'یافتم و وصلت کردم میتونی با مخاطب ناشناست چت کنی!'
          );
          
          chatFound = true;
          return {
            message: 'به یه نفر وصلت کردم باهاش چت کن',
            options: {
              reply_to_message_id: msg.message_id,
              reply_markup: JSON.stringify(uiHelpers.getChatKeyboard())
            }
          };
        }
      }

      if (!chatFound) {
        await Promise.all([
          users.updatePartner(msg.from.id, 'no'),
          users.updateStatus(msg.from.id, 'searching')
        ]);

        return {
          message: 'لطفا صبر کنید و هیچ پیامی نفرستید .... دارم میگردم',
          options: {
            reply_to_message_id: msg.message_id,
            reply_markup: JSON.stringify(uiHelpers.getChatKeyboard())
          }
        };
      }
    } catch (error) {
      console.error('Error in handleMainSearch:', error);
      return {
        message: 'خطایی رخ داد. لطفا دوباره تلاش کنید.'
      };
    }
  },

  handleChatInput: async (msg, userDetail) => {
    const partnerId = userDetail.partnerid;
    
    if (!partnerId || partnerId === 'no') return;

    try {
      if (msg.text) {
        const options = msg.reply_to_message ? { reply_to_message_id: msg.reply_to_message.message_id } : {};
        await bot.sendMessage(partnerId, msg.text, options);
        await chats.insert(msg.from.id, partnerId, msg.text);
      } else if (msg.forward_from_message_id) {
        await bot.forwardMessage(partnerId, msg.forward_from_chat.id, msg.forward_from_message_id);
      } else if (msg.sticker) {
        await bot.sendSticker(partnerId, msg.sticker.file_id);
      } else if (msg.voice) {
        await bot.sendVoice(partnerId, msg.voice.file_id);
      } else if (msg.audio) {
        await bot.sendAudio(partnerId, msg.audio.file_id);
      } else if (msg.photo) {
        await bot.sendPhoto(partnerId, msg.photo[msg.photo.length - 1].file_id);
      } else if (msg.document) {
        await bot.sendDocument(partnerId, msg.document.file_id);
      } else if (msg.video) {
        await bot.sendVideo(partnerId, msg.video.file_id);
      }
    } catch (error) {
      console.error('Error sending message to partner:', error);
      await bot.sendMessage(msg.from.id, 'خطا در ارسال پیام. احتمالا مخاطب شما از بات خارج شده است.');
    }
  },

  handleGenderSelection: async (msg) => {
    if (msg.text === 'دخترم 👩🏻') {
      await users.updateGender(msg.from.id, 'female');
      return messageHandlers.goHome(msg);
    } else if (msg.text === 'پسرم👨🏻') {
      await users.updateGender(msg.from.id, 'male');
      return messageHandlers.goHome(msg);
    }
  },

  handleCloseChat: async (msg, userDetail) => {
    try {
      await users.updateStatus(msg.from.id, 'joined');
      const partnerId = userDetail.partnerid;

      if (partnerId && partnerId !== 'no') {
        await users.updateStatus(partnerId, 'joined');
        await bot.sendMessage(partnerId, 'مکالمه شما توسط شریکتان پایان یافت');
        
        await redisHelpers.setUserLocation(partnerId, 'blocking');
        await bot.sendMessage(partnerId, 'میخوای بلاکش کنم ؟', {
          reply_markup: JSON.stringify(uiHelpers.getBlockKeyboard())
        });

        const userLimit = await redisHelpers.getUserLimit(msg.from.id);
        if (!userLimit) {
          await redisHelpers.setUserLimit(msg.from.id);
        }
      }

      return {
        message: 'میخوای بلاکش کنم ؟',
        options: {
          reply_markup: JSON.stringify(uiHelpers.getBlockKeyboard())
        },
        location: 'blocking'
      };
    } catch (error) {
      console.error('Error in handleCloseChat:', error);
      return messageHandlers.goHome(msg);
    }
  },

  handleBlocking: async (msg, userDetail) => {
    if (msg.text === 'نه') {
      await users.updatePartner(msg.from.id, 'no');
      return messageHandlers.goHome(msg);
    } else if (msg.text === 'اره') {
      await redisHelpers.setUserBlock(msg.from.id, userDetail.partnerid);
      await users.updatePartner(msg.from.id, 'no');
      return messageHandlers.goHome(msg);
    }
  },

  handleShowProfile: (userDetail, msg) => {
    const genderText = userDetail.gender === 'female' ? 'دختر' : 'پسر';
    return {
      message: `👤مشخصات شما:
👈کد کاربری: ${userDetail._id}
👈نام: ${userDetail.name}
👈جنسیت: ${genderText}
👈عضویت: عادی`,
      options: {
        reply_to_message_id: msg.message_id,
        reply_markup: JSON.stringify(uiHelpers.getProfileKeyboard())
      }
    };
  }
};

// Main message handler
bot.on('message', async (msg) => {
  try {
    const userId = msg.from.id;
    const text = msg.text;

    // Get user data
    let userDetail = await users.getUser(userId);
    let currentLocation = await redisHelpers.getUserLocation(userId) || 'home';
    let currentStep = await redisHelpers.getUserStep(userId);

    let response = null;

    // Handle text commands
    if (text) {
      if (/\/start/.test(text)) {
        response = await messageHandlers.handleStart(msg);
      } else if (/🔗 به یه ناشناس وصلم کن!/.test(text)) {
        response = await messageHandlers.handleSearch(msg, userDetail);
      } else if (/منوی اصلی/.test(text)) {
        response = messageHandlers.goHome(msg);
      } else if (/قطع مکالمه/.test(text)) {
        response = await messageHandlers.handleCloseChat(msg, userDetail);
      } else if (/مشخصات من/.test(text)) {
        currentLocation = 'showme';
      }
    }

    // Update location if changed
    if (response && response.location) {
      await redisHelpers.setUserLocation(userId, response.location);
      currentLocation = response.location;
    }

    // Handle location-based logic
    if (currentLocation === 'home') {
      if (!response) response = messageHandlers.goHome(msg);
    } else if (currentLocation === 'search') {
      if (currentStep === 'main_search') {
        response = await messageHandlers.handleMainSearch(msg, userDetail);
      } else if (currentStep === 'input_send') {
        await messageHandlers.handleChatInput(msg, userDetail);
      } else if (currentStep === 'setgender') {
        response = await messageHandlers.handleGenderSelection(msg);
      }
    } else if (currentLocation === 'closechat') {
      response = await messageHandlers.handleCloseChat(msg, userDetail);
    } else if (currentLocation === 'blocking') {
      response = await messageHandlers.handleBlocking(msg, userDetail);
    } else if (currentLocation === 'showme') {
      response = messageHandlers.handleShowProfile(userDetail, msg);
    }

    // Send response
    if (response && response.message) {
      await bot.sendMessage(userId, response.message, response.options || {});
    }
  } catch (error) {
    console.error('Error handling message:', error);
    try {
      await bot.sendMessage(msg.from.id, 'خطایی رخ داد. لطفا دوباره تلاش کنید یا /start را بزنید.');
    } catch (e) {
      console.error('Error sending error message:', e);
    }
  }
});

// Broadcast function
async function sendToAllUsers() {
  try {
    const allUsers = await users.getUsers();
    for (const user of allUsers) {
      try {
        await bot.sendMessage(
          user.TelegramBotnumber,
          'به کوچه پس کوچه سر نزدی ؟ پس حتما همین الان جستجو کن!'
        );
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error sending to user ${user.TelegramBotnumber}:`, error.message);
      }
    }
    console.log(`✅ Broadcast completed. Sent to ${allUsers.length} users.`);
  } catch (error) {
    console.error('Error broadcasting message:', error);
  }
}

// Error handling
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await client.quit();
  process.exit(0);
});

module.exports = { bot, sendToAllUsers };
