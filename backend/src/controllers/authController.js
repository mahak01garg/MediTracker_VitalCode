const User = require('../models/User');
const Doctor = require('../models/doctor.models.js');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
//const { OAuth2Client } = require('google-auth-library');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const emailService = require('../services/notification/EmailService');
const admin = require('../config/firebaseAdmin');
const { uploadToCloud, destroyFromCloud } = require('../utils/cloudinary');
const { uploadsDir } = require('../middleware/multer.middleware');
//const emailService = require("../services/notification/EmailService");

//const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const buildFileUrl = (req, filePath) => {
    if (!filePath) return '';
    if (/^https?:\/\//i.test(filePath)) return filePath;

    const normalizedPath = `/${String(filePath).replace(/\\/g, '/').replace(/^\/+/, '')}`;
    return `${req.protocol}://${req.get('host')}${normalizedPath}`;
};

const removeLocalFile = (filePath) => {
    if (!filePath || /^https?:\/\//i.test(filePath)) return;

    const absoluteFilePath = path.isAbsolute(filePath)
        ? filePath
        : path.join(uploadsDir, path.basename(filePath));

    if (fs.existsSync(absoluteFilePath)) {
        fs.unlinkSync(absoluteFilePath);
    }
};

const removeStoredProfilePicture = async (filePath) => {
    if (!filePath) return;

    if (/^https?:\/\/res\.cloudinary\.com\//i.test(filePath)) {
        await destroyFromCloud(filePath);
        return;
    }

    removeLocalFile(filePath);
};

const serializeUser = (user, req) => ({
    id: user._id,
    _id: user._id,
    email: user.email,
    name: user.name,
    role: 'patient',
    phone: user.phone || '',
    birthDate: user.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : '',
    address: user.address || '',
    emergencyContact: user.emergencyContact || {},
    notificationPreferences: user.notificationPreferences,
    rewardPoints: user.rewardPoints,
    isGoogleAuth: user.isGoogleAuth,
    profilePicture: buildFileUrl(req, user.profilePicture),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
});

const serializeDoctor = (doctor) => ({
    id: doctor._id,
    _id: doctor._id,
    email: doctor.email,
    name: doctor.name,
    role: 'doctor',
    phone: doctor.phone || '',
    specialization: doctor.specialization || '',
    experience: doctor.experience || 0,
    degree: doctor.degree || '',
    age: doctor.age || '',
    gender: doctor.gender || '',
    verified: Boolean(doctor.verified),
    profilePicture: doctor.avatar || '',
    createdAt: doctor.createdAt,
    updatedAt: doctor.updatedAt
});

exports.register = async (req, res) => {
    try {
        const {
            email,
            password,
            name,
            phone,
            role = 'patient',
            specialization,
            experience,
            degree,
            age,
            gender
        } = req.body;

        const normalizedRole = String(role).trim().toLowerCase();
        const normalizedEmail = String(email || '').trim().toLowerCase();

        // Validate inputs
        if (!email || !password || !name) {
            return res.status(400).json({ error: 'Email, password, and name are required' });
        }

        if (!['patient', 'doctor'].includes(normalizedRole)) {
            return res.status(400).json({ error: 'Role must be either patient or doctor' });
        }

        if (normalizedRole === 'doctor') {
            if (!phone || !specialization || !experience || !degree || !age || !gender) {
                return res.status(400).json({
                    error: 'Phone, specialization, experience, degree, age, and gender are required for doctor registration'
                });
            }

            const existingDoctor = await Doctor.findOne({
                $or: [{ email: normalizedEmail }, { phone: String(phone).trim() }]
            });

            if (existingDoctor) {
                return res.status(400).json({ error: 'Doctor already exists with this email or phone' });
            }

            const doctor = await Doctor.create({
                name: name.trim(),
                email: normalizedEmail,
                password,
                phone: String(phone).trim(),
                specialization: String(specialization).trim(),
                experience: Number(experience),
                degree: String(degree).trim(),
                age: Number(age),
                gender,
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name.trim())}&background=0D8ABC&color=fff`,
                verified: true
            });

            const accessToken = doctor.generateAccessToken();

            return res.status(201).json({
                success: true,
                message: 'Doctor registered successfully',
                token: accessToken,
                user: serializeDoctor(doctor)
            });
        }

        // Check if user exists
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const user = new User({
            email: normalizedEmail,
            password: hashedPassword,
            name,
            phone,
            notificationPreferences: {
                email: true,
                sms: phone ? true : false,
                push: true
            }
        });

        await user.save();
        
        // Send welcome email asynchronously (don't wait for it)
        emailService.sendWelcomeEmail(user.email, user.name)
            .then(() => console.log('📧 Welcome email sent to', user.email))
            .catch(err => console.error('❌ Welcome email failed:', err.message));

        // Generate token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
        );

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: {
                ...serializeUser(user, req)
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            success: false,
            error: error.message || 'Registration failed. Please try again.' 
        });
    }
};

// exports.login = async (req, res) => {
//     try {
//         const { email, password } = req.body;

//         // Find user
//         const user = await User.findOne({ email });
//         if (!user) {
//             return res.status(401).json({ error: 'Invalid credentials' });
//         }
//         if (!user.password || user.isGoogleAuth) {
//       return res.status(400).json({
//         error: "This account uses Google login. Please login with Google.",
//       });
//     }
//         // Check password
//         const isValidPassword = await bcrypt.compare(password, user.password);
//         if (!isValidPassword) {
//             return res.status(401).json({ error: 'Invalid credentials' });
//         }

//         // Generate token
//         const token = jwt.sign(
//             { userId: user._id },
//             process.env.JWT_SECRET,
//             { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN  }
//         );

//         res.json({
//             message: 'Login successful',
//             token,
//             user: {
//                 id: user._id,
//                 email: user.email,
//                 name: user.name,
//                 phone: user.phone,
//                 notificationPreferences: user.notificationPreferences,
//                 rewardPoints: user.rewardPoints
//             }
//         });
//     } catch (error) {
//         console.error('Login error:', error);
//         res.status(500).json({ error: 'Server error' });
//     }
// };
exports.login = async (req, res) => {
    try {
        const { email, password, role = 'patient' } = req.body;
        const normalizedRole = String(role).trim().toLowerCase();
        const normalizedEmail = String(email || '').trim().toLowerCase();

        console.log('=== LOGIN REQUEST ===');
        console.log('Email:', normalizedEmail);
        console.log('Password provided:', !!password);

        if (!email || !password) {
            console.log('❌ Missing email or password');
            return res.status(400).json({ 
                success: false,
                error: 'Email and password are required' 
            });
        }

        if (normalizedRole === 'doctor') {
            const doctor = await Doctor.findOne({ email: normalizedEmail });
            if (!doctor) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid credentials'
                });
            }

            const isValidPassword = await doctor.isPasswordCorrect(password);
            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid credentials'
                });
            }

            const accessToken = doctor.generateAccessToken();

            return res.status(200).json({
                success: true,
                message: 'Login successful',
                token: accessToken,
                user: serializeDoctor(doctor)
            });
        }

        // Find user by email
        const user = await User.findOne({ email: normalizedEmail });
        console.log('User found:', !!user);
        
        if (!user) {
            console.log('❌ User not found for email:', email);
            return res.status(401).json({ 
                success: false,
                error: 'Invalid credentials' 
            });
        }

        // Case 1: User signed up with Google only
        if (user.isGoogleAuth && !user.password) {
            console.log('User is Google-only account');
            return res.status(400).json({
                success: false,
                error: "This account uses Google login. Please login with Google.",
            });
        }

        // Case 2: Normal email/password login
        if (!user.isGoogleAuth || user.password) {
            if (!password) {
                return res.status(400).json({ 
                    success: false,
                    error: "Password is required" 
                });
            }

            console.log('Checking password...');
            const isValidPassword = await bcrypt.compare(password, user.password);
            console.log('Password valid:', isValidPassword);
            
            if (!isValidPassword) {
                console.log('❌ Invalid password');
                return res.status(401).json({ 
                    success: false,
                    error: 'Invalid credentials' 
                });
            }
        }

        // Generate JWT token
        console.log('Generating token...');
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
        );

        console.log('✅ Login successful for:', normalizedEmail);
        
        return res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                ...serializeUser(user, req)
            }
        });

    } catch (error) {
        console.error('❌ Login error:', error);
        return res.status(500).json({ 
            success: false,
            error: error.message || 'Login failed. Please try again.',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};



exports.googleAuth = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { uid, email, name } = req.user;

    // 1️⃣ Find by googleId
    let user = await User.findOne({ googleId: uid });

    // 2️⃣ If not found, try by email
    if (!user) {
      user = await User.findOne({ email });
    }

    // 3️⃣ Create user if not exists
    if (!user) {
      user = await User.create({
        email,
        name,
        googleId: uid,
        isGoogleAuth: true,
        password: undefined, // 🔥 IMPORTANT
      });
    } else {
      // 4️⃣ Attach googleId if missing
      if (!user.googleId) {
        user.googleId = uid;
        user.isGoogleAuth = true;
        user.password = undefined;
        await user.save({ validateBeforeSave: false });
      }
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
    );

    res.status(200).json({
      message: "Google authentication successful",
      token,
      user: {
        ...serializeUser(user, req)
      },
    });

  } catch (err) {
    console.error("Backend Google auth failed:", err.message);
    res.status(500).json({
      message: "Backend Google auth failed",
      error: err.message,
    });
  }
};



exports.getProfile = async (req, res) => {
    try {
        if (req.authRole === 'doctor') {
            const doctor = await Doctor.findById(req.userId).select('-password -refreshToken');
            if (!doctor) {
                return res.status(404).json({ error: 'Doctor not found' });
            }

            return res.json({ user: serializeDoctor(doctor) });
        }

        const user = await User.findById(req.userId)
            .select('-password -googleId');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user: serializeUser(user, req) });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { name, phone, birthDate, address, emergencyContact, removeProfilePicture } = req.body;
        if (req.authRole === 'doctor') {
            const doctor = await Doctor.findById(req.userId);
            if (!doctor) {
                return res.status(404).json({ error: 'Doctor not found' });
            }

            if (typeof name === 'string') doctor.name = name.trim();
            if (typeof phone === 'string') doctor.phone = phone.trim();

            if (req.file?.path) {
                const uploadResult = await uploadToCloud(req.file.path);
                doctor.avatar = uploadResult?.secure_url || uploadResult?.url || doctor.avatar;
            }

            await doctor.save();

            return res.json({
                message: 'Profile updated successfully',
                user: serializeDoctor(doctor)
            });
        }

        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        if (typeof name === 'string') user.name = name.trim();
        if (typeof phone === 'string') user.phone = phone.trim();
        if (typeof address === 'string') user.address = address.trim();
        if (typeof birthDate === 'string') {
            user.birthDate = birthDate ? new Date(birthDate) : undefined;
        }
        if (typeof emergencyContact === 'string') {
            user.emergencyContact = {
                ...user.emergencyContact,
                phone: emergencyContact.trim()
            };
        } else if (emergencyContact && typeof emergencyContact === 'object') {
            user.emergencyContact = {
                ...user.emergencyContact,
                ...emergencyContact
            };
        }

        const shouldRemoveProfilePicture =
            removeProfilePicture === true ||
            removeProfilePicture === 'true' ||
            removeProfilePicture === '1';

        if (shouldRemoveProfilePicture && user.profilePicture) {
            await removeStoredProfilePicture(user.profilePicture);
            user.profilePicture = '';
        }

        if (req.file?.path) {
            const previousProfilePicture = user.profilePicture;
            const hasCloudinaryConfig = Boolean(
                process.env.CLOUDINARY_CLOUD_NAME &&
                process.env.CLOUDINARY_API_KEY &&
                process.env.CLOUDINARY_API_SECRET
            );

            if (hasCloudinaryConfig) {
                const uploadResult = await uploadToCloud(req.file.path);
                user.profilePicture = uploadResult?.secure_url || uploadResult?.url || '';
            } else {
                user.profilePicture = `/uploads/${path.basename(req.file.path)}`;
            }

            if (previousProfilePicture && previousProfilePicture !== user.profilePicture) {
                await removeStoredProfilePicture(previousProfilePicture);
            }
        }
        
        user.updatedAt = Date.now();
        await user.save();

        res.json({
            message: 'Profile updated successfully',
            user: serializeUser(user, req)
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};
// Placeholder functions for routes you haven't implemented yet
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 🔐 Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.resetOtp = otp;
    user.resetOtpExpiry = Date.now() + 10 * 60 * 1000; // 10 min
    await user.save();

    // 📧 Send OTP email
    await emailService.sendEmail(
      email,
      "🔐 Password Reset OTP - MediTracker",
      `<h2>Password Reset</h2>
       <p>Your OTP is:</p>
       <h1>${otp}</h1>
       <p>This OTP is valid for 10 minutes.</p>`
    );

    res.status(200).json({
      message: "OTP sent to registered email",
    });

  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ message: "Failed to send OTP" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({
      email,
      resetOtp: otp,
      resetOtpExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetOtp = undefined;
    user.resetOtpExpiry = undefined;

    await user.save();

    res.status(200).json({ message: "Password reset successful" });

  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ message: "Password reset failed" });
  }
};
exports.resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.resetOtp || user.resetOtpExpiry < Date.now()) {
      // Generate new OTP if expired or missing
      user.resetOtp = Math.floor(100000 + Math.random() * 900000).toString();
      user.resetOtpExpiry = Date.now() + 10 * 60 * 1000; // 10 min
      await user.save();
    }

    await emailService.sendEmail(
      email,
      "🔐 Password Reset OTP - MediTracker",
      `<h2>Password Reset</h2>
       <p>Your OTP is:</p>
       <h1>${user.resetOtp}</h1>
       <p>This OTP is valid for 10 minutes.</p>`
    );

    res.status(200).json({ message: "OTP resent successfully" });
  } catch (err) {
    console.error("Resend OTP error:", err);
    res.status(500).json({ message: "Failed to resend OTP" });
  }
};

