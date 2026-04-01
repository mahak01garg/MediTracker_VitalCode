const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDatabase = async () => {
    try {
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/meditracker';
        
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });

        logger.info('MongoDB connected successfully');

        // Set up connection events
        mongoose.connection.on('connected', () => {
            logger.info('Mongoose connected to DB');
        });

        mongoose.connection.on('error', (err) => {
            logger.error('Mongoose connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            logger.warn('Mongoose disconnected from DB');
        });

        // Graceful shutdown
        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            logger.info('MongoDB connection closed through app termination');
            process.exit(0);
        });

    } catch (error) {
        logger.error('MongoDB connection failed:', error);
        process.exit(1);
    }
};

// Create indexes for better performance
const createIndexes = async () => {
    try {
        // User indexes
        await mongoose.connection.collection('users').createIndex({ email: 1 }, { unique: true });
        await mongoose.connection.collection('users').createIndex({ googleId: 1 }, { sparse: true });
        
        // Medication indexes
        await mongoose.connection.collection('medications').createIndex({ userId: 1 });
        await mongoose.connection.collection('medications').createIndex({ isActive: 1 });
        await mongoose.connection.collection('medications').createIndex({ 
            userId: 1, 
            isActive: 1,
            createdAt: -1 
        });
        
        // Dose indexes
        await mongoose.connection.collection('doses').createIndex({ userId: 1 });
        await mongoose.connection.collection('doses').createIndex({ medicationId: 1 });
        await mongoose.connection.collection('doses').createIndex({ scheduledTime: 1 });
        await mongoose.connection.collection('doses').createIndex({ status: 1 });
        await mongoose.connection.collection('doses').createIndex({ 
            userId: 1, 
            scheduledTime: 1 
        });
        await mongoose.connection.collection('doses').createIndex({ 
            userId: 1, 
            status: 1, 
            scheduledTime: 1 
        });
        
        // Health entry indexes
        await mongoose.connection.collection('healthentries').createIndex({ userId: 1 });
        await mongoose.connection.collection('healthentries').createIndex({ date: 1 });
        await mongoose.connection.collection('healthentries').createIndex({ 
            userId: 1, 
            date: -1 
        });
        
        // Reminder indexes
        await mongoose.connection.collection('reminders').createIndex({ userId: 1 });
        await mongoose.connection.collection('reminders').createIndex({ scheduledAt: 1 });
        await mongoose.connection.collection('reminders').createIndex({ status: 1 });
        await mongoose.connection.collection('reminders').createIndex({ 
            userId: 1, 
            status: 1, 
            scheduledAt: 1 
        });
        
        // Reward indexes
        await mongoose.connection.collection('rewards').createIndex({ userId: 1 });
        await mongoose.connection.collection('rewards').createIndex({ createdAt: -1 });
        await mongoose.connection.collection('rewards').createIndex({ type: 1 });
        
        logger.info('Database indexes created successfully');
    } catch (error) {
        logger.error('Error creating database indexes:', error);
    }
};

module.exports = {
    connectDatabase,
    createIndexes
};