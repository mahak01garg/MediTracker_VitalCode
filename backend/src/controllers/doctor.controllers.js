const Doctor = require("../models/doctor.models.js");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const { uploadToCloud } = require("../utils/cloudinary.js");
const { sendOtp } = require("../utils/sendotp.js");
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET;
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || process.env.JWT_EXPIRES_IN || "7d";
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || process.env.JWT_REFRESH_SECRET;
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || process.env.JWT_REFRESH_EXPIRES_IN || "30d";

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const generateAccessRefreshTokens = async (doctorId) => {
  try {
    const doctor = await Doctor.findById(doctorId);
    const accessToken = doctor.generateAccessToken();
    const refreshToken = doctor.generateRefreshToken();
    doctor.refreshToken = refreshToken;
    await doctor.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (err) {
    const error = new Error("Something went wrong while generating refresh and access token");
    error.statusCode = 500;
    throw error;
  }
};

const registerDoctor = async (req, res) => {
  try {
    const { name, email, phone, password, specialization, experience, degree, age, gender } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    // Validate all required fields
    if (!name || !email || !phone || !password || !specialization || !experience || !degree || !age || !gender) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if doctor already exists
    const existingDoctor = await Doctor.findOne({ $or: [{ email }, { phone }] });
    if (existingDoctor) {
      return res.status(400).json({ message: "Email or phone number already exists" });
    }

    // Check for avatar file
    if (!req.file) {
      return res.status(400).json({ message: "Avatar file is required" });
    }

    // Upload avatar to cloudinary
    let avatarUrl = '';
    try {
      const avatar = await uploadToCloud(req.file.path);
      if (!avatar || !avatar.url) {
        return res.status(500).json({ message: "Avatar upload failed" });
      }
      avatarUrl = avatar.url;
    } catch (uploadErr) {
      console.error('Cloudinary upload error:', uploadErr);
      return res.status(500).json({ message: "Failed to upload avatar: " + uploadErr.message });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

    // Send OTP email
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Your OTP for Email Verification",
        html: `<p>Your OTP is: <strong>${otp}</strong></p><p>This OTP is valid for 5 minutes.</p>`,
      });
    } catch (emailErr) {
      console.error('Email send error:', emailErr);
      return res.status(500).json({ message: "Failed to send verification email: " + emailErr.message });
    }

    // Create doctor record
    const doctor = await Doctor.create({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      password,
      specialization: specialization.trim(),
      experience: parseInt(experience), // Convert to number
      degree: degree.trim(),
      age: parseInt(age), // Convert to number
      gender,
      avatar: avatarUrl,
      verified: false,
      otp,
      otpExpires,
    });

    const userFromDB = await Doctor.findById(doctor._id).select("-password -refreshToken");

    return res.status(201).json({ 
      success: true, 
      data: userFromDB, 
      message: "Doctor Registered Successfully! Please verify your email." 
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(error.statusCode || 500).json({ 
      success: false,
      message: error.message || "Registration failed" 
    });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const doctor = await Doctor.findOne({ email });
    if (!doctor) {
      return res.status(400).json({ message: "Doctor not found" });
    }

    if (doctor.otp !== otp || doctor.otpExpires < new Date()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    doctor.verified = true;
    doctor.otp = undefined;
    doctor.otpExpires = undefined;
    await doctor.save();

    res.status(200).json({ success: true, message: "Email verified successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const loginDoctor = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    const doctor = await Doctor.findOne({ email: normalizedEmail });
    if (!doctor) {
      return res.status(404).json({ message: "Doctor doesn't exist" });
    }

    const valid = await doctor.isPasswordCorrect(password);
    if (!valid) {
      return res.status(401).json({ message: "Invalid user credentials" });
    }
    if (!doctor.verified) {
      return res.status(401).json({ message: "Please verify your email first" });
    }

    const { accessToken, refreshToken } = await generateAccessRefreshTokens(doctor._id);
    const loggedUserFromDB = await Doctor.findById(doctor._id).select("-password -refreshToken");

    const cookieOptions = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", refreshToken, cookieOptions)
      .json({
        success: true,
        data: {
          doctor: loggedUserFromDB,
          accessToken,
          refreshToken,
        },
        message: "Doctor logged In Successfully"
      });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const logoutDoctor = async (req, res) => {
  try {
    await Doctor.findByIdAndUpdate(req.doctor._id, { $unset: { refreshToken: 1 } }, { new: true });
    const cookieOptions = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .clearCookie("accessToken", cookieOptions)
      .clearCookie("refreshToken", cookieOptions)
      .json({ success: true, message: "Doctor logged Out successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const refreshAccessToken = async (req, res) => {
  try {
    const incomingToken = req.cookies.refreshToken || req.body.refreshToken;
    
    if (!incomingToken) {
      return res.status(401).json({ message: "Unauthorized Request" });
    }

    const decodedToken = jwt.verify(incomingToken, REFRESH_TOKEN_SECRET);
    const doctor = await Doctor.findById(decodedToken._id);
    
    if (!doctor || incomingToken !== doctor.refreshToken) {
      return res.status(401).json({ message: "Invalid or expired refresh token" });
    }

    const cookieOptions = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, refreshToken: newRefreshToken } = await generateAccessRefreshTokens(doctor._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", newRefreshToken, cookieOptions)
      .json({
        success: true,
        data: { accessToken, refreshToken: newRefreshToken },
        message: "Token Refreshed"
      });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getCurrentDoctor = async (req, res) => {
  try {
    return res.status(200).json({ 
      success: true, 
      data: req.doctor, 
      message: "Current User Data" 
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateDoctor = async (req, res) => {
  try {
    const { name, email, phone, password, specialization, experience, degree, age, gender } = req.body;
    
    const doctor = await Doctor.findById(req.doctor._id);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    if ((email && email !== doctor.email) || (phone && phone !== doctor.phone)) {
      const existingDoctor = await Doctor.findOne({
        $or: [{ email }, { phone }],
        _id: { $ne: doctor._id },
      });

      if (existingDoctor) {
        return res.status(400).json({ message: "Email or phone already in use" });
      }
    }

    if (name) doctor.name = name;
    if (email) doctor.email = email;
    if (phone) doctor.phone = phone;
    if (specialization) doctor.specialization = specialization;
    if (experience) doctor.experience = experience;
    if (degree) doctor.degree = degree;
    if (age) doctor.age = age;
    if (gender) doctor.gender = gender;

    if (password) {
      doctor.password = await bcrypt.hash(password, 10);
    }

    if (req.file?.path) {
      const avatar = await uploadToCloud(req.file.path);
      if (!avatar) {
        return res.status(500).json({ message: "Avatar upload failed" });
      }
      doctor.avatar = avatar.url;
    }

    await doctor.save();
    const updatedDoctor = await Doctor.findById(doctor._id).select("-password -refreshToken");

    return res.status(200).json({ 
      success: true, 
      data: updatedDoctor, 
      message: "Doctor updated successfully" 
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { doctorId, otp } = req.body;

    if (!doctorId || !otp) {
      return res.status(400).json({ message: "Doctor ID and OTP are required" });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    if (doctor.otp !== otp || doctor.otpExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    doctor.verified = true;
    doctor.otp = null;
    doctor.otpExpires = null;
    await doctor.save();

    const accessToken = jwt.sign(
      { _id: doctor._id, email: doctor.email, userType: "Doctor" }, 
      ACCESS_TOKEN_SECRET, 
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );
    const refreshToken = jwt.sign(
      { _id: doctor._id }, 
      REFRESH_TOKEN_SECRET, 
      { expiresIn: REFRESH_TOKEN_EXPIRY }
    );

    const cookieOptions = { httpOnly: true, secure: true };

    return res
      .status(200)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", refreshToken, cookieOptions)
      .json({ 
        success: true, 
        data: { doctorId: doctor._id }, 
        message: "OTP verified successfully!" 
      });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getAllDoctors = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      specialization,
      experience,
      gender,
      verified,
      search
    } = req.query;

    const filter = {};
    
    if (specialization) {
      filter.specialization = { $regex: specialization, $options: 'i' };
    }
    
    if (experience) {
      filter.experience = { $gte: parseInt(experience) };
    }
    
    if (gender) {
      filter.gender = gender;
    }
    
    if (verified !== undefined) {
      filter.verified = verified === 'true';
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { specialization: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const totalDoctors = await Doctor.countDocuments(filter);
    
    const doctors = await Doctor.find(filter)
      .select('-password -refreshToken -otp -otpExpires')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalPages = Math.ceil(totalDoctors / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    const paginationInfo = {
      currentPage: parseInt(page),
      totalPages,
      totalDoctors,
      limit: parseInt(limit),
      hasNextPage,
      hasPrevPage
    };

    return res.status(200).json({
      success: true,
      data: {
        doctors,
        pagination: paginationInfo
      },
      message: `Found ${doctors.length} doctors`
    });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching doctors: " + error.message });
  }
};

const getDoctorById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid doctor ID format" });
    }

    const doctor = await Doctor.findById(id).select('-password -refreshToken -otp -otpExpires');

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    if (!doctor.verified) {
      return res.status(404).json({ message: "Doctor profile not available" });
    }

    return res.status(200).json({
      success: true,
      data: doctor,
      message: "Doctor details fetched successfully"
    });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching doctor details: " + error.message });
  }
};

module.exports = { 
  registerDoctor, 
  loginDoctor, 
  verifyOtp, 
  verifyEmail, 
  logoutDoctor, 
  refreshAccessToken,
  getCurrentDoctor,
  updateDoctor,
  getAllDoctors,
  getDoctorById,
};
