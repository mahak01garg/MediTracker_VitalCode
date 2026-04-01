const socketIO = require('socket.io');
const logger = require('../../utils/logger');

class SocketService {
    constructor() {
        this.io = null;
        this.connectedUsers = new Map(); // userId -> socketId
    }

    initialize(server) {
        this.io = socketIO(server, {
            cors: {
                origin: process.env.FRONTEND_URL || 'http://localhost:3000',
                methods: ['GET', 'POST'],
                credentials: true
            },
            pingTimeout: 60000,
            pingInterval: 25000
        });

        this.setupEventHandlers();
        logger.info('WebSocket server initialized');
    }

    setupEventHandlers() {
        this.io.on('connection', (socket) => {
            logger.info(`New WebSocket connection: ${socket.id}`);

            // Handle user authentication
            socket.on('authenticate', (userId) => {
                this.handleAuthentication(socket, userId);
            });

            // Handle medication reminders
            socket.on('medication_reminder', (data) => {
                this.handleMedicationReminder(socket, data);
            });

            // Handle dose status updates
            socket.on('dose_status_update', (data) => {
                this.handleDoseStatusUpdate(socket, data);
            });

            // Handle health data updates
            socket.on('health_data_update', (data) => {
                this.handleHealthDataUpdate(socket, data);
            });

            // Handle chat messages
            socket.on('chat_message', (data) => {
                this.handleChatMessage(socket, data);
            });

            // Handle notification preferences
            socket.on('notification_preferences', (data) => {
                this.handleNotificationPreferences(socket, data);
            });

            // Handle disconnect
            socket.on('disconnect', () => {
                this.handleDisconnect(socket);
            });

            // Handle errors
            socket.on('error', (error) => {
                logger.error('Socket error:', error);
            });
        });
    }

    handleAuthentication(socket, userId) {
        if (!userId) {
            socket.emit('authentication_error', { message: 'User ID is required' });
            return;
        }

        // Store user connection
        this.connectedUsers.set(userId, socket.id);
        socket.userId = userId;

        // Join user to their personal room
        socket.join(`user:${userId}`);

        logger.info(`User ${userId} authenticated on socket ${socket.id}`);
        socket.emit('authentication_success', { 
            message: 'Authentication successful',
            userId 
        });

        // Send any pending notifications
        this.sendPendingNotifications(userId);
    }

    handleMedicationReminder(socket, data) {
        const { doseId, action } = data;
        const userId = socket.userId;

        if (!userId) {
            socket.emit('error', { message: 'User not authenticated' });
            return;
        }

        logger.info(`Medication reminder action from user ${userId}: ${action}`);

        // Broadcast to user's room (for multi-device sync)
        socket.to(`user:${userId}`).emit('medication_reminder_update', {
            doseId,
            action,
            timestamp: new Date().toISOString()
        });

        // Acknowledge the action
        socket.emit('medication_reminder_acknowledged', {
            doseId,
            action,
            timestamp: new Date().toISOString()
        });
    }

    handleDoseStatusUpdate(socket, data) {
        const { doseId, status, medicationName } = data;
        const userId = socket.userId;

        if (!userId) {
            socket.emit('error', { message: 'User not authenticated' });
            return;
        }

        logger.info(`Dose status update from user ${userId}: ${medicationName} - ${status}`);

        // Broadcast to user's room
        socket.to(`user:${userId}`).emit('dose_status_updated', {
            doseId,
            status,
            medicationName,
            timestamp: new Date().toISOString(),
            userId
        });

        // Update dashboard in real-time
        this.io.to(`user:${userId}`).emit('dashboard_update', {
            type: 'dose_status',
            data: { doseId, status, medicationName }
        });
    }

    handleHealthDataUpdate(socket, data) {
        const userId = socket.userId;

        if (!userId) {
            socket.emit('error', { message: 'User not authenticated' });
            return;
        }

        logger.info(`Health data update from user ${userId}`);

        // Broadcast to user's room
        socket.to(`user:${userId}`).emit('health_data_updated', {
            ...data,
            timestamp: new Date().toISOString()
        });
    }

    handleChatMessage(socket, data) {
        const { message, chatId } = data;
        const userId = socket.userId;

        if (!userId) {
            socket.emit('error', { message: 'User not authenticated' });
            return;
        }

        logger.info(`Chat message from user ${userId}: ${message.substring(0, 50)}...`);

        // Here you would typically save the message to database
        // and broadcast to appropriate recipients

        // For now, just echo back
        socket.emit('chat_message_received', {
            message,
            chatId,
            timestamp: new Date().toISOString(),
            sender: 'user'
        });

        // Simulate AI response
        setTimeout(() => {
            const responses = [
                "I understand you're asking about your medications. Could you be more specific?",
                "I can help you with your medication schedule. What would you like to know?",
                "Based on your medication history, I notice you've been doing well with adherence!"
            ];
            
            const aiResponse = responses[Math.floor(Math.random() * responses.length)];
            
            socket.emit('chat_message_received', {
                message: aiResponse,
                chatId,
                timestamp: new Date().toISOString(),
                sender: 'ai'
            });
        }, 1000);
    }

    handleNotificationPreferences(socket, data) {
        const userId = socket.userId;

        if (!userId) {
            socket.emit('error', { message: 'User not authenticated' });
            return;
        }

        logger.info(`Notification preferences update from user ${userId}`);

        // Broadcast to user's room
        socket.to(`user:${userId}`).emit('notification_preferences_updated', {
            ...data,
            timestamp: new Date().toISOString()
        });
    }

    handleDisconnect(socket) {
        const userId = socket.userId;
        
        if (userId) {
            this.connectedUsers.delete(userId);
            logger.info(`User ${userId} disconnected from socket ${socket.id}`);
        } else {
            logger.info(`Anonymous user disconnected from socket ${socket.id}`);
        }
    }

    async sendPendingNotifications(userId) {
        try {
            // Fetch pending notifications from database
            // For now, send a welcome message
            const socketId = this.connectedUsers.get(userId);
            
            if (socketId) {
                this.io.to(socketId).emit('notification', {
                    type: 'welcome',
                    title: 'Welcome to MediTracker!',
                    message: 'Your real-time notifications are now active.',
                    timestamp: new Date().toISOString()
                });
            }
        } catch (error) {
            logger.error('Error sending pending notifications:', error);
        }
    }

    // Public methods to send notifications
    sendMedicationReminder(userId, reminderData) {
        const socketId = this.connectedUsers.get(userId);
        
        if (socketId) {
            this.io.to(socketId).emit('medication_reminder', {
                ...reminderData,
                type: 'medication_reminder',
                timestamp: new Date().toISOString()
            });
            
            logger.info(`Sent medication reminder to user ${userId}`);
            return true;
        }
        
        logger.warn(`User ${userId} not connected, cannot send reminder`);
        return false;
    }

    sendMissedDoseAlert(userId, alertData) {
        const socketId = this.connectedUsers.get(userId);
        
        if (socketId) {
            this.io.to(socketId).emit('missed_dose_alert', {
                ...alertData,
                type: 'missed_dose',
                timestamp: new Date().toISOString()
            });
            
            logger.info(`Sent missed dose alert to user ${userId}`);
            return true;
        }
        
        return false;
    }

    sendAchievementNotification(userId, achievementData) {
        const socketId = this.connectedUsers.get(userId);
        
        if (socketId) {
            this.io.to(socketId).emit('achievement_unlocked', {
                ...achievementData,
                type: 'achievement',
                timestamp: new Date().toISOString()
            });
            
            logger.info(`Sent achievement notification to user ${userId}`);
            return true;
        }
        
        return false;
    }

    sendHealthInsight(userId, insightData) {
        const socketId = this.connectedUsers.get(userId);
        
        if (socketId) {
            this.io.to(socketId).emit('health_insight', {
                ...insightData,
                type: 'health_insight',
                timestamp: new Date().toISOString()
            });
            
            return true;
        }
        
        return false;
    }

    // Broadcast to all connected users (admin use only)
    broadcastToAll(event, data) {
        this.io.emit(event, data);
        logger.info(`Broadcast event ${event} to all connected users`);
    }

    // Get connected users count
    getConnectedUsersCount() {
        return this.connectedUsers.size;
    }

    // Check if user is connected
    isUserConnected(userId) {
        return this.connectedUsers.has(userId);
    }

    // Get user's socket ID
    getUserSocketId(userId) {
        return this.connectedUsers.get(userId);
    }
}

module.exports = new SocketService();