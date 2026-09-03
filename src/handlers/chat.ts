import TelegramBot from 'node-telegram-bot-api';
import { HandlerContext } from '../types.js';
import { User } from '../models/user.js';
import { Chat } from '../models/chat.js';

export async function handleChatInput(
  ctx: HandlerContext,
  bot: TelegramBot
): Promise<void> {
  const { user, msg } = ctx;
  const partnerId = user?.partnerid;

  if (!partnerId || partnerId === 'no') return;

  try {
    if (msg.text) {
      const opts: TelegramBot.SendMessageOptions = msg.reply_to_message
        ? { reply_to_message_id: msg.reply_to_message.message_id }
        : {};
      await bot.sendMessage(partnerId, msg.text, opts);
      await Chat.create({ from: msg.from!.id, to: Number(partnerId), chat: msg.text });
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
    } else if (msg.video_note) {
      await bot.sendVideoNote(partnerId, msg.video_note.file_id);
    } else if (msg.animation) {
      await bot.sendAnimation(partnerId, msg.animation.file_id);
    }
  } catch (error) {
    console.error('Error forwarding message:', error);
    await bot.sendMessage(msg.from!.id, 'خطا در ارسال پیام. احتمالا مخاطبت از بات خارج شده.');
  }
}
