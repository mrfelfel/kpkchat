# 🤖 Koche Bot - Telegram Random Chat Bot

A modern and advanced Telegram bot for random chats, similar to Omegle and Chatroulette platforms.

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-blue)](https://www.linkedin.com/in/mjyq/)
[![Telegram](https://img.shields.io/badge/Telegram-@developeroc-blue)](https://t.me/developeroc)

## 📋 Table of Contents

- [Features](#-features)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#️-configuration)
- [Project Structure](#-project-structure)
- [Usage](#-usage)
- [Commands](#-commands)
- [Development](#-development)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

- 🎲 **Random Matching**: Connect users with each other randomly
- 💬 **Real-time Chat**: Live messaging between connected users
- 👥 **User Profiles**: Store user information (name, age, gender, city)
- 🔍 **Search Filters**: Find users based on gender preferences
- 🚫 **Block System**: Block inappropriate users
- ⏱️ **Rate Limiting**: Prevent spam with time-based restrictions
- 📊 **Statistics**: Display bot statistics for admins
- 🔔 **Broadcast Messages**: Send announcements to all users

## 🔧 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (version 16 or higher)
- **MongoDB** (version 4.4 or higher)
- **Redis** (version 6 or higher)
- **Yarn** or **npm**

## 📦 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/koche-bot.git
cd koche-bot

### 2. Install Dependencies

bash
yarn install
# or
npm install

### 3. Start MongoDB

bash
# Start MongoDB service
mongod --dbpath /path/to/data

### 4. Start Redis

bash
# Start Redis server
redis-server

### 5. Configure Environment Variables

Copy `.env.example` to `.env`:

bash
cp .env.example .env

Then configure your values:

env
BOT_TOKEN=your_telegram_bot_token_here
MONGODB_URI=mongodb://localhost:27017/koche-bot
REDIS_URL=redis://localhost:6379
ADMIN_ID=your_telegram_user_id
NODE_ENV=development

### 6. Run the Project

bash
# Development mode
yarn dev

# Production mode
yarn start

## ⚙️ Configuration

### Getting Telegram Bot Token

1. Message [@BotFather](https://t.me/botfather) on Telegram
2. Send the `/newbot` command
3. Choose a name and username for your bot
4. Copy the token to your `.env` file

### Redis Configuration

Redis is used for:

- Storing temporary user states
- Rate limiting
- Caching information

### MongoDB Configuration

MongoDB is used for persistent storage:

- User information
- Chat history
- Statistics and reports

## 📁 Project Structure


koche-bot/
├── index.js          # Main entry point
├── bot.js            # Core bot logic and handlers
├── connect.js        # MongoDB connection
├── users.js          # User model and operations
├── chat.js           # Chat model and operations
├── package.json      # Dependencies and scripts
├── .env              # Environment variables (git ignored)
├── .env.example      # Example environment variables
└── README.md         # Documentation

## 🎯 Usage

### Bot Commands

| Command | Description |
|---------|-------------|
| `/start` | Start the bot and register |
| `/search` | Start searching for a random user |
| `/next` | Connect to the next user |
| `/stop` | End chat and return to menu |
| `/block` | Block current user |
| `/profile` | View and edit profile |
| `/stats` | Display statistics (admin only) |

### User Flow


User → /start → Register → /search → Find Match → Chat → /next or /stop

## 🛠️ Development

### Adding New Features

1. Edit the relevant file (`bot.js` for handlers)
2. Add new models if needed
3. Define necessary Redis keys
4. Test and commit your changes

### Debugging

To enable debug mode:

bash
NODE_ENV=development yarn start

### Logging

All errors and important events are logged to the console.

## 🧪 Testing

bash
# Run tests
yarn test

# Check coverage
yarn test:coverage

## 🔒 Security

- ✅ Environment variables for sensitive data
- ✅ Rate limiting to prevent spam
- ✅ User input validation
- ✅ Error handling and exception management

## 🚀 Deployment

### Using PM2

bash
# Install PM2
npm install -g pm2

# Start the bot
pm2 start index.js --name koche-bot

# View logs
pm2 logs koche-bot

# Restart
pm2 restart koche-bot

### Using Docker

dockerfile
# Dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN yarn install --production
COPY . .
CMD ["node", "index.js"]

bash
# Build image
docker build -t koche-bot .

# Run container
docker run -d --name koche-bot --env-file .env koche-bot

## 📊 Monitoring

To monitor bot health:

- Check MongoDB logs
- Monitor Redis memory usage
- Track active user count
- Monitor rate limit violations

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the project
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Developer

Built with ❤️ by **Mohammad Javad Yousefi**

- 💼 LinkedIn: [mjyq](https://www.linkedin.com/in/mjyq/)
- 📱 Telegram: [@developeroc](https://t.me/developeroc)

## 🙏 Acknowledgments

- [node-telegram-bot-api](https://github.com/yagop/node-telegram-bot-api)
- [Mongoose](https://mongoosejs.com/)
- [Redis](https://redis.io/)

## 📞 Support

If you have questions or issues:

- Open an issue on GitHub
- Message on Telegram [@developeroc](https://t.me/developeroc)

---

**Note**: This bot is for educational purposes only. Please use it responsibly.

