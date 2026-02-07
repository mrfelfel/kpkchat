const mongoose = require('mongoose');

// MongoDB connection configuration
const mongoConfig = {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

// MongoDB connection URL from environment or default
const MONGODB_URI = process.env.MONGODB_URI 

// Connection function
async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI, mongoConfig);
    console.log('✅ MongoDB connected successfully');
    
    // Connection event listeners
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

// Initialize connection
connectDB();

module.exports = mongoose;
