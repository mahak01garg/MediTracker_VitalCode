const app = require('./app');
const mongoose = require('mongoose');
const path = require('path');
const socketService = require('./services/websocket/socketService');
const logger = require('./utils/logger');
const notificationRoutes = require('./routes/notificationRoutes');
const CronJobManager = require('./services/scheduler/cronJobs');
const DoseNotificationManager = require('./services/notification/DoseNotificationManager');
const MissedDoseDetector = require('./services/scheduler/MissedDoseDetector');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

require('./config/firebase'); 
const PORT = process.env.PORT || 5000;
const PRIMARY_MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/meditracker';
const FALLBACK_MONGODB_URI = 'mongodb://127.0.0.1:27017/meditracker';
const allowStartupWithoutDb =
  process.env.ALLOW_START_WITHOUT_DB === 'true' || process.env.NODE_ENV !== 'production';
DoseNotificationManager;
app.use('/api/notifications', notificationRoutes);

const connectMongo = async () => {
  const connectOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
  };

  try {
    await mongoose.connect(PRIMARY_MONGODB_URI, connectOptions);
    logger.info('Connected to MongoDB (primary URI)');
    return true;
  } catch (primaryError) {
    logger.error('Primary MongoDB connection failed:', primaryError);

    if (PRIMARY_MONGODB_URI !== FALLBACK_MONGODB_URI) {
      try {
        logger.warn(`Retrying MongoDB connection with fallback URI: ${FALLBACK_MONGODB_URI}`);
        await mongoose.connect(FALLBACK_MONGODB_URI, connectOptions);
        logger.info('Connected to MongoDB (fallback local URI)');
        return true;
      } catch (fallbackError) {
        logger.error('Fallback MongoDB connection failed:', fallbackError);
      }
    }

    if (allowStartupWithoutDb) {
      logger.warn('Starting server without MongoDB connection. Database-backed routes may fail until MongoDB is available.');
      return false;
    }

    throw primaryError;
  }
};

const startServer = async () => {
  try {
    const isMongoConnected = await connectMongo();

    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      if (!isMongoConnected) {
        logger.warn('Server is running in limited mode because MongoDB is disconnected.');
      } else {
        CronJobManager.initialize();
        MissedDoseDetector.init();
      }
      socketService.initialize(server);
    });
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
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
