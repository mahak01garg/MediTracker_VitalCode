const jwt = require('jsonwebtoken');
const Doctor = require('../models/doctor.models.js');
const Client = require('../models/client.model.js');
const User = require('../models/User.js');

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET;

const verifyToken = (token, secret) => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
};

/**
 * Authentication middleware that identifies user type and sets req.doctor or req.client
 * Supports both Doctor and Client JWT tokens
 */
const isAuthenticated = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        message: 'No token provided, authorization denied' 
      });
    }

    const token = authHeader.split(' ')[1];
    const decodedAccess = verifyToken(token, ACCESS_TOKEN_SECRET);
    const decodedUser = verifyToken(token, process.env.JWT_SECRET);

    // Appointment system access token (Doctor/Client)
    if (decodedAccess?.userType === 'Doctor') {
      const doctor = await Doctor.findById(decodedAccess._id).select('-password -refreshToken');
      if (!doctor) {
        return res.status(401).json({ 
          success: false,
          message: 'Doctor not found' 
        });
      }
      req.doctor = doctor;
      req.user = doctor;
      req.userType = 'Doctor';
    } else if (decodedAccess?.userType === 'Client') {
      const client = await Client.findById(decodedAccess._id).select('-password -refreshToken');
      if (!client) {
        return res.status(401).json({ 
          success: false,
          message: 'Client not found' 
        });
      }
      req.client = client;
      req.user = client;
      req.userType = 'Client';
    // Main app token (User model)
    } else if (decodedUser?.userId) {
      const user = await User.findById(decodedUser.userId).select('-password');
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }
      req.client = user;
      req.user = user;
      req.userType = 'User';
    } else {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid user type in token' 
      });
    }

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: 'Token expired' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Server error during authentication' 
    });
  }
};

/**
 * Doctor-only authentication middleware
 */
const isDoctorAuthenticated = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        message: 'No token provided' 
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);

    if (decoded.userType !== 'Doctor') {
      return res.status(403).json({ 
        success: false,
        message: 'Only doctors can access this resource' 
      });
    }

    const doctor = await Doctor.findById(decoded._id).select('-password -refreshToken');
    if (!doctor) {
      return res.status(401).json({ 
        success: false,
        message: 'Doctor not found' 
      });
    }

    req.doctor = doctor;
    req.user = doctor;
    req.userType = 'Doctor';
    next();
  } catch (error) {
    console.error('Doctor authentication error:', error);
    res.status(401).json({ 
      success: false,
      message: 'Authentication failed' 
    });
  }
};

/**
 * Client-only authentication middleware
 */
const isClientAuthenticated = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        message: 'No token provided' 
      });
    }

    const token = authHeader.split(' ')[1];
    const decodedAccess = verifyToken(token, ACCESS_TOKEN_SECRET);
    const decodedUser = verifyToken(token, process.env.JWT_SECRET);

    if (decodedAccess?.userType === 'Client') {
      const client = await Client.findById(decodedAccess._id).select('-password -refreshToken');
      if (!client) {
        return res.status(401).json({
          success: false,
          message: 'Client not found'
        });
      }
      req.client = client;
      req.user = client;
      req.userType = 'Client';
      return next();
    }

    // Compatibility for existing app users authenticated via /api/auth/*
    if (decodedUser?.userId) {
      const user = await User.findById(decodedUser.userId).select('-password');
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }
      req.client = user;
      req.user = user;
      req.userType = 'User';
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Only clients can access this resource'
    });
  } catch (error) {
    console.error('Client authentication error:', error);
    res.status(401).json({ 
      success: false,
      message: 'Authentication failed' 
    });
  }
};

module.exports = { isAuthenticated, isDoctorAuthenticated, isClientAuthenticated };
