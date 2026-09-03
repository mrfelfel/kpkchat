import { AVAILABLE_INTERESTS } from './models/user.js';

export const kb = {
  home: () => ({
    resize_keyboard: true,
    keyboard: [
      [{ text: '🔗 وصلم کن!' }],
      [{ text: '👤 مشخصات من' }, { text: 'ℹ️ درباره بات' }],
      [{ text: '💬 اعتراف ناشناس' }, { text: '❓ سوال ناشناس' }],
    ],
  }),

  chat: () => ({
    resize_keyboard: true,
    keyboard: [['🛑 قطع مکالمه']],
  }),

  gender: () => ({
    resize_keyboard: true,
    keyboard: [[{ text: '👩🏻 دخترم' }, { text: '👨🏻 پسرم' }]],
  }),

  block: () => ({
    resize_keyboard: true,
    keyboard: [[{ text: '✅ آره' }, { text: '❌ نه' }]],
  }),

  rate: () => ({
    resize_keyboard: true,
    keyboard: [
      [{ text: '⭐' }, { text: '⭐⭐' }, { text: '⭐⭐⭐' }],
      [{ text: '⭐⭐⭐⭐' }, { text: '⭐⭐⭐⭐⭐' }],
    ],
  }),

  profile: () => ({
    resize_keyboard: true,
    keyboard: [
      [{ text: '✏️ تغییر مشخصات' }, { text: '🎯 تغییر علاقه‌مندی‌ها' }],
      [{ text: '🏠 منوی اصلی' }],
    ],
  }),

  interests: (selected: string[] = []) => {
    const rows: { text: string }[][] = [];
    for (let i = 0; i < AVAILABLE_INTERESTS.length; i += 3) {
      const row = AVAILABLE_INTERESTS.slice(i, i + 3).map((interest) => ({
        text: selected.includes(interest) ? `✅ ${interest}` : `☐ ${interest}`,
      }));
      rows.push(row);
    }
    rows.push([{ text: '✔️ تایید' }]);
    return { resize_keyboard: true, keyboard: rows };
  },

  confession: () => ({
    resize_keyboard: true,
    keyboard: [[{ text: '❌ انصراف' }]],
  }),
};
