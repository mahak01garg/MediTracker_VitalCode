const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: { service: 'meditracker-api' },
    transports: [
        // Write all logs with level 'error' and below to error.log
        new winston.transports.File({ 
            filename: path.join(logDir, 'error.log'), 
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        
        // Write all logs with level 'info' and below to combined.log
        new winston.transports.File({ 
            filename: path.join(logDir, 'combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        
        // Also log to console in development
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.printf(
                    ({ level, message, timestamp, ...meta }) => {
                        return `${timestamp} ${level}: ${message} ${
                            Object.keys(meta).length ? JSON.stringify(meta) : ''
                        }`;
                    }
                )
            )
        })
    ]
});

// Create a stream object for Morgan
logger.stream = {
    write: (message) => {
        logger.info(message.trim());
    }
};

// Custom logging methods
logger.apiLog = (req, res, error = null) => {
    const logData = {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        responseTime: res.responseTime,
        user: req.userId || 'anonymous',
        ip: req.ip,
        userAgent: req.get('user-agent')
    };

    if (error) {
        logger.error('API Error', { ...logData, error: error.message });
    } else if (res.statusCode >= 400) {
        logger.warn('API Warning', logData);
    } else {
        logger.info('API Request', logData);
    }
};

// Middleware to log requests
logger.requestLogger = (req, res, next) => {
    const start = Date.now();
    
    // Capture response finish
    res.on('finish', () => {
        res.responseTime = Date.now() - start;
        logger.apiLog(req, res);
    });

    // Capture errors
    res.on('error', (error) => {
        res.responseTime = Date.now() - start;
        logger.apiLog(req, res, error);
    });

    next();
};

// Log unhandled errors
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

module.exports = logger;