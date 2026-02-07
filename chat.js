const db = require("./connect");
const { Schema } = db;

// Define Chat Schema
const chatSchema = new Schema({
  from: { 
    type: String, 
    required: true,
    index: true 
  },
  to: { 
    type: String, 
    required: true,
    index: true 
  },
  chat: { 
    type: String, 
    required: true 
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Create compound index for better query performance
chatSchema.index({ from: 1, to: 1, createdAt: -1 });

const Chat = db.model('chats', chatSchema);

class Chats {
  /**
   * Insert a new chat message
   */
  async insert(from, to, chat) {
    try {
      return await Chat.create({
        from,
        to,
        chat
      });
    } catch (error) {
      console.error('Error inserting chat:', error);
      throw error;
    }
  }

  /**
   * Get chat history between two users
   */
  async getChatHistory(user1, user2, limit = 50) {
    try {
      return await Chat.find({
        $or: [
          { from: user1, to: user2 },
          { from: user2, to: user1 }
        ]
      })
      .sort({ createdAt: -1 })
      .limit(limit);
    } catch (error) {
      console.error('Error getting chat history:', error);
      throw error;
    }
  }

  /**
   * Get all chats from a specific user
   */
  async getUserChats(userId, limit = 100) {
    try {
      return await Chat.find({ from: userId })
        .sort({ createdAt: -1 })
        .limit(limit);
    } catch (error) {
      console.error('Error getting user chats:', error);
      throw error;
    }
  }

  /**
   * Delete chat history between two users
   */
  async deleteChatHistory(user1, user2) {
    try {
      return await Chat.deleteMany({
        $or: [
          { from: user1, to: user2 },
          { from: user2, to: user1 }
        ]
      });
    } catch (error) {
      console.error('Error deleting chat history:', error);
      throw error;
    }
  }

  /**
   * Count total messages between two users
   */
  async countMessages(user1, user2) {
    try {
      return await Chat.countDocuments({
        $or: [
          { from: user1, to: user2 },
          { from: user2, to: user1 }
        ]
      });
    } catch (error) {
      console.error('Error counting messages:', error);
      throw error;
    }
  }

  /**
   * Get chat statistics
   */
  async getStats() {
    try {
      const total = await Chat.countDocuments();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayCount = await Chat.countDocuments({
        createdAt: { $gte: today }
      });

      return { total, today: todayCount };
    } catch (error) {
      console.error('Error getting stats:', error);
      throw error;
    }
  }
}

module.exports = new Chats();
