# KPKChat — Telegram Anonymous Chat Bot

KPKChat is a simple anonymous random chat bot for Telegram.  
It connects users randomly and lets them chat without revealing their identity.

Built with **Node.js**, **Telegram Bot API**, **Redis**, and **MongoDB**.

---

## Features

- Anonymous 1‑to‑1 random chat
- Gender selection before matching
- Real‑time message forwarding
- Supports text, photo, video, voice, sticker, audio, and documents
- User state management with Redis
- Chat history stored in MongoDB
- Block user after chat
- Basic anti‑spam limit (search cooldown)
- Graceful shutdown handling

---

## Project Structure

```
kpkchat/
├── index.js        # Main bot logic and message handling
├── connect.js      # MongoDB connection (mongoose)
├── users.js        # User model and user-related queries
├── chat.js         # Chat storage and history logic
├── package.json    # Project metadata and dependencies
├── yarn.lock
├── .env.example    # Environment variables example
└── README.md
```

---

## Requirements

- Node.js v18+
- Redis
- MongoDB
- Telegram Bot Token (from BotFather)

---

## Installation

### 1. Clone the repository
```bash
git clone https://github.com/mrfelfel/kpkchat.git
cd kpkchat
```

### 2. Install dependencies
```bash
npm install
# or
yarn install
```

### 3. Environment variables

Create a `.env` file based on `.env.example`:

```env
TELEGRAM_BOT_TOKEN=YOUR_TELEGRAM_BOT_TOKEN
REDIS_URL=redis://localhost:6379
MONGODB_URI=mongodb://localhost:27017/kpkchat
```

---

## Run the Bot

```bash
node index.js
```

After startup, the bot will connect to:
- Telegram (polling mode)
- Redis (user state & limits)
- MongoDB (users and chat history)

---

## How It Works (Simple Flow)

1. User sends `/start`
2. Bot registers the user if new
3. User selects gender (once)
4. User starts search
5. Bot matches two available users
6. Messages are forwarded between them
7. Chat ends → user can block partner

---

## Data Storage

### Redis
Used for:
- User location (home, search, chat, blocking)
- User step (searching, chatting, gender selection)
- Search rate limit
- Temporary states

### MongoDB
Used for:
- User profiles
- Chat messages
- Chat statistics

---

## Broadcast Message

The bot includes a broadcast helper:

```js
sendToAllUsers()
```

Sends a message to all registered users with rate‑limit safety.

---

## Error Handling

- Redis connection errors
- MongoDB connection recovery
- Telegram polling errors
- Graceful shutdown on `SIGINT`

---

## License

MIT License  
You are free to use, modify, and distribute this project.

---

## Author

**mrfelfel**  
Email: qazvinyjavad@gmail.com  
GitHub: https://github.com/mrfelfel

---

## Privacy

This bot does not expose user identities.  
Chats are stored only for moderation and statistics purposes.

