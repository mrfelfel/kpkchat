const db = require("./connect");
const { Schema } = db;

// Define User Schema
const userSchema = new Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, lowercase: true, index: true },
  TelegramBotnumber: { type: String, required: true, unique: true, index: true },
  status: { type: String, enum: ['joined', 'searching', 'chatting', 'blocked'], default: 'joined' },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  city: String,
  partnerid: { type: String, default: '0' }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Create indexes for better query performance
userSchema.index({ status: 1, TelegramBotnumber: 1 });

const User = db.model('users', userSchema);

class Users {
  /**
   * Create a new user
   */
  async insert(username, name, TelegramBotnumber) {
    try {
      return await User.create({
        username: username.toLowerCase(),
        name,
        TelegramBotnumber,
        status: 'joined',
        partnerid: '0'
      });
    } catch (error) {
      console.error('Error inserting user:', error);
      throw error;
    }
  }

  /**
   * Get user by Telegram ID
   */
  async getUser(TelegramBotnumber) {
    try {
      return await User.findOne({ TelegramBotnumber });
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  }

  /**
   * Get all active users
   */
  async getUsers() {
    try {
      return await User.find({
        status: 'joined',
        TelegramBotnumber: { $ne: null }
      });
    } catch (error) {
      console.error('Error getting users:', error);
      throw error;
    }
  }

  /**
   * Update user status
   */
  async updateStatus(TelegramBotnumber, status) {
    try {
      return await User.findOneAndUpdate(
        { TelegramBotnumber },
        { $set: { status } },
        { new: true }
      );
    } catch (error) {
      console.error('Error updating status:', error);
      throw error;
    }
  }

  /**
   * Update user partner
   */
  async updatePartner(TelegramBotnumber, partner) {
    try {
      return await User.findOneAndUpdate(
        { TelegramBotnumber },
        { $set: { partnerid: partner } },
        { new: true }
      );
    } catch (error) {
      console.error('Error updating partner:', error);
      throw error;
    }
  }

  /**
   * Update user gender
   */
  async updateGender(TelegramBotnumber, gender) {
    try {
      return await User.findOneAndUpdate(
        { TelegramBotnumber },
        { $set: { gender } },
        { new: true }
      );
    } catch (error) {
      console.error('Error updating gender:', error);
      throw error;
    }
  }

  /**
   * Random search for a chat partner
   */
  async randomSearch(tid) {
    try {
      const count = await User.countDocuments({
        status: 'searching',
        TelegramBotnumber: { $ne: tid }
      });

      if (count === 0) {
        return null;
      }

      const randomSkip = Math.floor(Math.random() * count);
      return await User.findOne({
        status: 'searching',
        TelegramBotnumber: { $ne: tid }
      }).skip(randomSkip);
    } catch (error) {
      console.error('Error in random search:', error);
      throw error;
    }
  }

  /**
   * Get user statistics (bonus method)
   */
  async getStats() {
    try {
      const total = await User.countDocuments();
      const searching = await User.countDocuments({ status: 'searching' });
      const chatting = await User.countDocuments({ status: 'chatting' });
      
      return { total, searching, chatting };
    } catch (error) {
      console.error('Error getting stats:', error);
      throw error;
    }
  }
}

module.exports = new Users();
