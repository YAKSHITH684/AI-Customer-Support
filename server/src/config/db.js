const mongoose = require('mongoose');
const dns = require('dns');
const config = require('./env');

// Configure reliable DNS servers for Atlas SRV lookup on Windows
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (dnsErr) {
  // Ignore if running in constrained environment
}

let mongoServer = null;

const connectDB = async () => {
  try {
    let uri = config.MONGODB_URI;

    if (!uri) {
      console.log('ℹ️  No MONGODB_URI provided. Initializing in-memory MongoDB server...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoServer = await MongoMemoryServer.create();
      uri = mongoServer.getUri();
      console.log(`✅ In-memory MongoDB Server started at: ${uri}`);
    }

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000
    });

    console.log(`✅ MongoDB Connected successfully: ${mongoose.connection.host || 'in-memory-db'}`);

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected.');
    });

  } catch (error) {
    console.error('⚠️  Failed to connect to primary MongoDB, falling back to in-memory instance:', error.message);
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoServer = await MongoMemoryServer.create();
      const fallbackUri = mongoServer.getUri();
      await mongoose.connect(fallbackUri);
      console.log(`✅ Fallback in-memory MongoDB Server started at: ${fallbackUri}`);
    } catch (fallbackError) {
      console.error('❌ Critical: Failed to launch fallback MongoDB:', fallbackError);
      process.exit(1);
    }
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
    console.log('MongoDB connection closed.');
  } catch (err) {
    console.error('Error disconnecting MongoDB:', err);
  }
};

module.exports = { connectDB, disconnectDB };
