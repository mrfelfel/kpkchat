# KPKChat — Anonymous Chat Telegram Bot

Random anonymous 1-on-1 chat bot for Telegram with interest-based matching, chat ratings, and anonymous confessions.

## Features

- **Interest-based matching** — users select topics, matched by shared interests
- **Chat ratings** — rate your chat partner after each conversation (1-5 stars)
- **Anonymous confessions & questions** — post to a Telegram channel anonymously
- **Full media support** — text, photo, video, voice, sticker, audio, document, GIF, video note
- **Gender selection** — male/female before first chat
- **Block system** — block annoying partners after chat ends
- **Anti-spam** — 1-minute cooldown between searches
- **State machine** — Redis-backed user state management

## Tech Stack

- **Runtime:** Node.js + TypeScript
- **Bot:** node-telegram-bot-api
- **Database:** MongoDB (mongoose)
- **State:** Redis

## Project Structure

```
kpkchat/
├── src/
│   ├── index.ts              # Main entry & message routing
│   ├── db.ts                 # MongoDB connection
│   ├── config.ts             # Redis client & helpers
│   ├── keyboards.ts          # Telegram keyboard layouts
│   ├── types.ts              # Shared TypeScript types
│   ├── models/
│   │   ├── user.ts           # User schema & interests
│   │   ├── chat.ts           # Chat message storage
│   │   └── confession.ts     # Anonymous confessions
│   └── handlers/
│       ├── start.ts          # /start, gender, interests setup
│       ├── search.ts         # Random matching with interest filter
│       ├── chat.ts           # Message forwarding
│       ├── rating.ts         # Post-chat rating & close
│       └── confession.ts     # Anonymous confessions/questions
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Setup

### Prerequisites

- Node.js 18+
- Redis
- MongoDB
- Telegram Bot Token (from @BotFather)

### Install

```bash
git clone https://github.com/mrfelfel/kpkchat.git
cd kpkchat
npm install
```

### Configure

```bash
cp .env.example .env
```

Edit `.env` with your tokens. To enable anonymous confessions, create a Telegram channel, add the bot as admin, and set `CONFESSION_CHANNEL_ID`.

### Run

```bash
npm run build
npm start

# or dev mode
npm run dev
```

## How It Works

1. User sends `/start` → registers if new
2. Selects gender (once)
3. Selects interest topics (up to 5)
4. Hits "🔗 وصلم کن!" to search
5. Bot matches by shared interests (fallback: any available user)
6. Shows shared interest tag on match
7. Messages forwarded in real-time
8. "🛑 قطع مکالمه" ends chat → both users rate each other
9. Optional: block partner after rating

## Anonymous Confessions

- Set `CONFESSION_CHANNEL_ID` in `.env`
- Users tap "💬 اعتراف ناشناس" or "❓ سوال ناشناس"
- Write their text → posted to the channel anonymously

## Environment Variables

| Variable | Description |
|----------|-------------|
| `TELEGRAM_BOT_TOKEN` | Bot token from @BotFather |
| `REDIS_URL` | Redis connection URL |
| `MONGODB_URI` | MongoDB connection URI |
| `CONFESSION_CHANNEL_ID` | Channel ID for confessions (optional) |

## License

MIT
