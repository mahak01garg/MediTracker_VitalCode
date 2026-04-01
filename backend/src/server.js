const app = require('./app');
const mongoose = require('mongoose');
const path = require('path');
 const  cronJobManager = require('./services/scheduler/cronJobs');
const socketService = require('./services/websocket/socketService');
const logger = require('./utils/logger');
const notificationRoutes = require('./routes/notificationRoutes');
const DoseNotificationManager = require('./services/notification/DoseNotificationManager');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

require('./config/firebase'); 
const PORT = process.env.PORT || 5000;
const PRIMARY_MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/meditracker';
const FALLBACK_MONGODB_URI = 'mongodb://127.0.0.1:27017/meditracker';
DoseNotificationManager;
app.use('/api/notifications', notificationRoutes);

const connectMongo = async () => {
  const connectOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  };

  try {
    await mongoose.connect(PRIMARY_MONGODB_URI, connectOptions);
    logger.info('Connected to MongoDB (primary URI)');
  } catch (primaryError) {
    logger.error('Primary MongoDB connection failed:', primaryError);

    if (PRIMARY_MONGODB_URI !== FALLBACK_MONGODB_URI) {
      logger.warn(`Retrying MongoDB connection with fallback URI: ${FALLBACK_MONGODB_URI}`);
      await mongoose.connect(FALLBACK_MONGODB_URI, connectOptions);
      logger.info('Connected to MongoDB (fallback local URI)');
      return;
    }

    throw primaryError;
  }
};

const startServer = async () => {
  try {
    await connectMongo();

    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      socketService.initialize(server);
      cronJobManager.initialize();
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
