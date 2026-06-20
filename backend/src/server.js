const app = require('./app');
const mongoose = require('mongoose');
const path = require('path');
const socketService = require('./services/websocket/socketService');
const logger = require('./utils/logger');
const notificationRoutes = require('./routes/notificationRoutes');
const CronJobManager = require('./services/scheduler/cronJobs');
const DoseNotificationManager = require('./services/notification/DoseNotificationManager');
const MissedDoseDetector = require('./services/scheduler/MissedDoseDetector');
const ReminderScheduler = require('./services/scheduler/ReminderScheduler');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

require('./config/firebase'); 
const PORT = process.env.PORT || 5000;
const PRIMARY_MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/meditracker';
const FALLBACK_MONGODB_URI = 'mongodb://127.0.0.1:27017/meditracker';
const allowStartupWithoutDb =
  process.env.ALLOW_START_WITHOUT_DB === 'true' || process.env.NODE_ENV !== 'production';
DoseNotificationManager;
app.use('/api/notifications', notificationRoutes);

const connectMongo = async (opts = {}) => {
  const maxRetries = Number.parseInt(process.env.MONGODB_CONNECT_RETRIES || '5', 10);
  const baseDelay = Number.parseInt(process.env.MONGODB_RETRY_DELAY_MS || '2000', 10);
  const connectOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: Number.parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || '20000', 10),
    socketTimeoutMS: Number.parseInt(process.env.MONGODB_SOCKET_TIMEOUT_MS || '20000', 10),
  };

  const tryConnect = async (uri) => {
    try {
      await mongoose.connect(uri, connectOptions);
      logger.info(`Connected to MongoDB: ${uri.includes('@') ? uri.split('@')[1] : uri}`);
      return true;
    } catch (err) {
      logger.warn(`MongoDB connect attempt failed for ${uri}: ${err && err.message ? err.message : err}`);
      return false;
    }
  };

  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    logger.info(`MongoDB connection attempt ${attempt}/${maxRetries}`);
    // try primary
    if (PRIMARY_MONGODB_URI && await tryConnect(PRIMARY_MONGODB_URI)) return true;

    // try fallback if provided and different
    if (FALLBACK_MONGODB_URI && FALLBACK_MONGODB_URI !== PRIMARY_MONGODB_URI) {
      if (await tryConnect(FALLBACK_MONGODB_URI)) return true;
    }

    // wait before next retry
    const delay = baseDelay * attempt;
    logger.info(`Waiting ${delay}ms before next MongoDB connect attempt`);
    // eslint-disable-next-line no-await-in-loop
    await new Promise((r) => setTimeout(r, delay));
  }

  logger.error('All MongoDB connection attempts failed');

  if (allowStartupWithoutDb) {
    logger.warn('Starting server without MongoDB connection. Database-backed routes may fail until MongoDB is available.');
    return false;
  }

  throw new Error('Unable to connect to MongoDB after retries');
};

const startServer = async () => {
  // Start the HTTP server immediately so the platform (Render) can detect the port binding.
  const server = app.listen(PORT, () => {
    logger.info(`Server listening on port ${PORT}`);
  });

  // Initialize websockets regardless of DB status (they rely on server instance)
  socketService.initialize(server);

  try {
    const isMongoConnected = await connectMongo();

    if (!isMongoConnected) {
      logger.warn('Server is running in limited mode because MongoDB is disconnected.');
      return;
    }

    // Only initialize jobs when DB connection is healthy
    CronJobManager.initialize();
    await MissedDoseDetector.init();
    // Initialize ReminderScheduler after DB connect to avoid early DB queries
    try {
      ReminderScheduler.init();
      logger.info('ReminderScheduler initialized after MongoDB connection');
    } catch (rsErr) {
      logger.warn('Failed to initialize ReminderScheduler:', rsErr && rsErr.message ? rsErr.message : rsErr);
    }

    logger.info('Background jobs initialized after MongoDB connection');
  } catch (error) {
    logger.error('MongoDB connection error after server start:', error && error.message ? error.message : error);
    // If DB is required, exit. Otherwise keep server running in limited mode.
    if (!allowStartupWithoutDb) {
      logger.error('Exiting because MongoDB is required but connection failed');
      // Give logs a moment to flush
      setTimeout(() => process.exit(1), 500);
    }
  }
};

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    logger.error('Unhandled Promise Rejection:', err);
    // Close server & exit process
    process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Shutting down gracefully...');
    mongoose.connection.close();
    process.exit(0);
});
