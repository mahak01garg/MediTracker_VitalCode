<<<<<<< HEAD
// const jwt = require('jsonwebtoken');
// const User = require('../models/User');
// const logger = require('../utils/logger');
// const admin = require("../config/firebaseAdmin.js");

// // Normal auth middleware
// const auth = async (req, res, next) => {
//     try {
//         const authHeader = req.headers.authorization;
//         if (!authHeader || !authHeader.startsWith('Bearer ')) {
//             return res.status(401).json({ error: 'No token provided, authorization denied' });
//         }
//         const token = authHeader.split(' ')[1];
//         const decoded = jwt.verify(token, process.env.JWT_SECRET);
//         const user = await User.findById(decoded.userId).select('-password');
//         if (!user) return res.status(401).json({ error: 'User no longer exists' });
//         req.user = user;
//         req.userId = decoded.userId;
//         next();
//     } catch (error) {
//         logger.error('Authentication error:', error);
//         if (error.name === 'JsonWebTokenError') return res.status(401).json({ error: 'Invalid token' });
//         if (error.name === 'TokenExpiredError') return res.status(401).json({ error: 'Token expired' });
//         res.status(500).json({ error: 'Server error during authentication' });
//     }
// };
// //const admin = require("../config/firebaseAdmin.js");

// const firebaseAuth = async (req, res, next) => {
//   try {
//     const authHeader = req.headers.authorization;
//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//       return res.status(401).json({ message: "No token provided" });
//     }

//     const token = authHeader.split(" ")[1];

//     // Verify Firebase ID token
//     const decodedToken = await admin.auth().verifyIdToken(token);
//     console.log("Firebase token verified:", decodedToken);

//     // Set user info for downstream controllers
//     req.user = {
//       uid: decodedToken.uid,
//       email: decodedToken.email,
//       name: decodedToken.name,
//     };

//     // Optional: find user in DB
//     const User = require("../models/User");
//     const user = await User.findOne({ firebaseUid: decodedToken.uid });
//     if (!user) return res.status(401).json({ message: "User not found" });

//     req.userId = user._id; // MongoDB ID
//     req.user = user;       // full user object

//     next();
//   } catch (err) {
//     console.log("Firebase verify error:", err.message);
//     res.status(401).json({ message: "Invalid or expired token" });
//   }
// };

// module.exports = { firebaseAuth };

// module.exports = {
//     auth,
//     firebaseAuth
// };

=======


>>>>>>> 13ecc7878de3000beb44d5c2a41b83556df1f15c
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Doctor = require('../models/doctor.models.js');
const admin = require("../config/firebaseAdmin.js");


const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided, authorization denied' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.userId) {
      const user = await User.findById(decoded.userId).select('-password');
      if (!user) return res.status(401).json({ error: 'User no longer exists' });
      req.user = user;
      req.userId = decoded.userId;
      req.authRole = 'patient';
      return next();
    }

    if (decoded._id && decoded.userType === 'Doctor') {
      const doctor = await Doctor.findById(decoded._id).select('-password -refreshToken');
      if (!doctor) return res.status(401).json({ error: 'Doctor no longer exists' });
      req.user = doctor;
      req.userId = decoded._id;
      req.doctor = doctor;
      req.authRole = 'doctor';
      return next();
    }

    return res.status(401).json({ error: 'Invalid token' });
  } catch (error) {
    console.error('Authentication error:', error);
    if (error.name === 'JsonWebTokenError') return res.status(401).json({ error: 'Invalid token' });
    if (error.name === 'TokenExpiredError') return res.status(401).json({ error: 'Token expired' });
    res.status(500).json({ error: 'Server error during authentication' });
<<<<<<< HEAD
  }
};

// Optional Firebase Auth middleware (for future use)
const firebaseAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ message: "No token provided" });

    const token = authHeader.split(" ")[1];
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Only Firebase info, no DB lookup
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name
    };
    next();
  } catch (err) {
    console.log("Firebase verify error:", err.message);
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = { auth, firebaseAuth };
=======
  }
};


const firebaseAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ message: "No token provided" });

    const token = authHeader.split(" ")[1];
    const decodedToken = await admin.auth().verifyIdToken(token);

   
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name
    };
    next();
  } catch (err) {
    console.log("Firebase verify error:", err.message);
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = { auth, firebaseAuth };
>>>>>>> 13ecc7878de3000beb44d5c2a41b83556df1f15c
