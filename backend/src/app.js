<<<<<<< HEAD
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();
const dashboardRoutes = require('./routes/dashboard');
const doseRoutes = require('./routes/doses');
const emailService = require('./services/notification/EmailService');
// Import routes
const authRoutes = require('./routes/auth');
const medicationRoutes = require('./routes/medication');
const reminderRoutes = require('./routes/reminders');
const healthRoutes = require('./routes/health');
const aiRoutes = require('./routes/ai');
const rewardRoutes = require('./routes/reward');
const emailTestRoutes = require('./routes/emailTest');
const scheduleRoutes = require('./routes/scheduleRoutes');
const CronJobManager = require('./services/scheduler/cronJobs');
const MissedDoseDetector = require('./services/scheduler/MissedDoseDetector');
const analyticsRoutes = require('./routes/analyticsRoutes');
const ChangePassword = require('./routes/changePasswordRoute');
const ambulanceRoutes = require('./routes/ambulance.routes.js');

// Import appointment routes
const appointmentScheduleRoutes = require('./routes/schedule.routes.js');
const appointmentSlotRequestRoutes = require('./routes/slotRequest.routes.js');
const appointmentDoctorRoutes = require('./routes/doctor.routes.js');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const { auth, firebaseAuth } = require('./middleware/auth');
const userRoutes = require('./routes/userRoutes');

const app = express();

const explicitAllowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
].filter(Boolean);

const isLocalOrigin = (origin = '') =>
  /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\]|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})(:\d+)?$/i.test(origin);

const corsOptions = {
  origin: (origin, callback) => {
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    // Allow non-browser tools (curl/postman) and same-origin server calls.
    if (!origin) return callback(null, true);

    if (isLocalOrigin(origin) || explicitAllowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  next();
});



CronJobManager.initialize();
try {
  MissedDoseDetector.init(); 
} catch (err) {
  console.error('Warning: MissedDoseDetector init failed:', err.message);
}

app.use(helmet({
  contentSecurityPolicy: false // 🔥 disable CSP for API (important)
}));
// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200, // dev ke liye thoda loose
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests'
    });
  }
});
app.use('/api/auth', limiter);

// CORS configuration - FIX THIS SECTION


// app.use(cors({
//   origin: function (origin, callback) {
//     // origin can be undefined (curl, mobile, etc.)
//     if (!origin) return callback(null, true);

//     if (allowedOrigins.includes(origin)) {
//       callback(null, true);
//     } else {
//       console.log('Blocked by CORS:', origin);
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
//   credentials: true,
//   methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
//   allowedHeaders: ['Content-Type','Authorization','X-Requested-With','Accept'],
//   exposedHeaders: ['Content-Range','X-Content-Range']
// }));

// // Optional: handle preflight explicitly
// app.options('*', cors({
//   origin: allowedOrigins,
//   credentials: true
// }));


// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Logging
app.use(morgan('combined'));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/auth', authRoutes);

// Debug endpoint - verify backend is running
app.get('/api/debug/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Backend is responding',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

app.use('/api/medications', medicationRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/rewards', rewardRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/doses', doseRoutes);
app.use('/api/email-test', emailTestRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/user',ChangePassword);
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use('/api/ambulance', ambulanceRoutes);
console.log('All scheduled services initialized');
app.use('/api/schedule', scheduleRoutes);
app.use('/api/user',userRoutes);

// Appointment System Routes
app.use('/api/appointments/schedule', appointmentScheduleRoutes);
app.use('/api/appointments/slots', appointmentSlotRequestRoutes);
app.use('/api/appointments/doctors', appointmentDoctorRoutes);

// Health check endpoint
=======
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();
const dashboardRoutes = require('./routes/dashboard');
const doseRoutes = require('./routes/doses');
const emailService = require('./services/notification/EmailService');
// Import routes
const authRoutes = require('./routes/auth');
const medicationRoutes = require('./routes/medication');
const reminderRoutes = require('./routes/reminders');
const healthRoutes = require('./routes/health');
const aiRoutes = require('./routes/ai');
const rewardRoutes = require('./routes/reward');
const emailTestRoutes = require('./routes/emailTest');
const scheduleRoutes = require('./routes/scheduleRoutes');
const CronJobManager = require('./services/scheduler/cronJobs');
const MissedDoseDetector = require('./services/scheduler/MissedDoseDetector');
const analyticsRoutes = require('./routes/analyticsRoutes');
const ChangePassword=require('./routes/changePasswordRoute');
// Import middleware
const errorHandler = require('./middleware/errorHandler');
const { auth, firebaseAuth } = require('./middleware/auth');
const userRoutes=require('./routes/userRoutes');
const app = express();

app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));


app.options('*', cors());
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  next();
});



CronJobManager.initialize();
MissedDoseDetector.init(); 

app.use(helmet({
  contentSecurityPolicy: false 
}));
// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200, // dev ke liye thoda loose
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests'
    });
  }
});
app.use('/api/auth', limiter);


app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Logging
app.use(morgan('combined'));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/medications', medicationRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/rewards', rewardRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/doses', doseRoutes);
app.use('/api/email-test', emailTestRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/user',ChangePassword);
app.use("/api/notifications", require("./routes/notificationRoutes"));
console.log('All scheduled services initialized');
app.use('/api/schedule', scheduleRoutes);
app.use('/api/user',userRoutes);
// Health check endpoint
>>>>>>> 13ecc7878de3000beb44d5c2a41b83556df1f15c
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: 'connected'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl
    });
});

// Error handling middleware
app.use(errorHandler);

module.exports = app;
