const SlotRequest = require('../models/slotRequest.model.js');
const Schedule = require('../models/schedule.model.js');
const Doctor = require('../models/doctor.models.js');
const Client = require('../models/client.model.js');
const User = require('../models/User.js');
const crypto = require('crypto');

const buildAssetUrl = (req, filePath) => {
  if (!filePath) return '';
  if (/^https?:\/\//i.test(filePath)) return filePath;
  const normalizedPath = `/${String(filePath).replace(/\\/g, '/').replace(/^\/+/, '')}`;
  return `${req.protocol}://${req.get('host')}${normalizedPath}`;
};

const normalizeDoctor = (doctor, req) => {
  if (!doctor) return null;
  const doctorObject = doctor.toObject ? doctor.toObject() : doctor;
  return {
    ...doctorObject,
    avatar: buildAssetUrl(req, doctorObject.avatar),
    profilePicture: buildAssetUrl(req, doctorObject.avatar || doctorObject.profilePicture),
  };
};

const normalizePatient = (patient, req) => {
  if (!patient) return null;
  const patientObject = patient.toObject ? patient.toObject() : patient;
  const picture = patientObject.profilePicture || patientObject.avatar || '';
  return {
    ...patientObject,
    avatar: buildAssetUrl(req, picture),
    profilePicture: buildAssetUrl(req, picture),
  };
};

const getRazorpayClient = () => {
  let Razorpay;
  try {
    Razorpay = require('razorpay');
  } catch (e) {
    return null;
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return null;
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
};

const requestSlot = async (req, res) => {
  try {
    console.log('Received slot request:', req.body);
    console.log('Request user:', req.user, 'Doctor:', req.doctor, 'Client:', req.client);

    const { scheduleId, slotIndex } = req.body;

    // Use only req.client for patientId
    const patientId = req.client?._id;
    if (!patientId) {
      return res.status(401).json({ message: "Unauthorized: Client user not found in request" });
    }

    if (!scheduleId || slotIndex === undefined) {
      console.error('Missing required fields:', { scheduleId, slotIndex });
      return res.status(400).json({ message: "scheduleId and slotIndex are required" });
    }

    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) {
      console.error('Schedule not found for ID:', scheduleId);
      return res.status(404).json({ message: "Schedule not found" });
    }

    const doctorId = schedule.doctorId;

    const slot = schedule.slots[slotIndex];
    if (!slot) {
      console.error('Slot index invalid:', slotIndex, 'Slots length:', schedule.slots.length);
      return res.status(400).json({ message: "Slot index invalid" });
    }
    if (slot.isBooked) {
      console.error('Slot already booked:', slotIndex);
      return res.status(400).json({ message: "Slot not available" });
    }

    const newRequest = await SlotRequest.create({
      doctorId,
      patientId,
      scheduleId,
      slotIndex,
      date: schedule.date,
      time: slot.time,
      fee: slot.fee
    });

    slot.requestId = newRequest._id;
    await schedule.save();

    console.log('Slot requested successfully:', newRequest._id);
    res.status(201).json({ success: true, request: newRequest });
  } catch (err) {
    console.error('Error in requestSlot:', err);
    res.status(500).json({ message: 'Failed to request slot', error: err.message });
  }
};

const createPaymentOrder = async (req, res) => {
  try {
    const razorpay = getRazorpayClient();
    if (!razorpay) {
      return res.status(500).json({ message: 'Razorpay is not configured on server' });
    }

    const { scheduleId, slotIndex } = req.body;
    const patientId = req.client?._id;

    if (!patientId) {
      return res.status(401).json({ message: 'Unauthorized: Client user not found' });
    }

    if (!scheduleId || slotIndex === undefined) {
      return res.status(400).json({ message: 'scheduleId and slotIndex are required' });
    }

    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) return res.status(404).json({ message: 'Schedule not found' });
    const doctorId = schedule.doctorId;

    const slot = schedule.slots?.[slotIndex];
    if (!slot) return res.status(400).json({ message: 'Slot index invalid' });

    // If booked by another user, block payment start
    if (slot.isBooked && slot.bookedBy?.toString() !== patientId.toString()) {
      return res.status(400).json({ message: 'Slot not available' });
    }

    let request = await SlotRequest.findOne({
      doctorId,
      patientId,
      scheduleId,
      slotIndex,
      paymentStatus: 'unpaid',
      status: { $in: ['pending', 'accepted'] },
    }).sort({ createdAt: -1 });

    if (!request) {
      request = await SlotRequest.create({
        doctorId,
        patientId,
        scheduleId,
        slotIndex,
        date: schedule.date,
        time: slot.time,
        fee: slot.fee,
        status: 'pending',
        paymentStatus: 'unpaid',
      });
    }

    const amount = Math.round(Number(request.fee || 0) * 100);
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid slot fee for payment' });
    }

    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: `appt_${request._id.toString().slice(-10)}_${Date.now()}`,
      notes: {
        requestId: request._id.toString(),
        doctorId: doctorId.toString(),
        patientId: patientId.toString(),
      },
    });

    request.paymentOrderId = order.id;
    await request.save();

    if (!slot.requestId) {
      slot.requestId = request._id;
      await schedule.save();
    }

    return res.status(201).json({
      success: true,
      data: {
        requestId: request._id,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        doctorName: undefined,
        patientName: req.client?.name || '',
      },
    });
  } catch (err) {
    console.error('Error creating payment order:', err);
    return res.status(500).json({ message: 'Failed to create payment order', error: err.message });
  }
};

const verifyPaymentAndConfirm = async (req, res) => {
  try {
    const { requestId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const patientId = req.client?._id;

    if (!patientId) {
      return res.status(401).json({ message: 'Unauthorized: Client user not found' });
    }

    if (!requestId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing payment verification payload' });
    }

    const request = await SlotRequest.findById(requestId);
    if (!request) return res.status(404).json({ message: 'Appointment request not found' });

    if (request.patientId.toString() !== patientId.toString()) {
      return res.status(403).json({ message: 'Not authorized for this appointment payment' });
    }

    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expected !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    if (request.paymentOrderId && request.paymentOrderId !== razorpay_order_id) {
      return res.status(400).json({ message: 'Payment order mismatch' });
    }

    const schedule = await Schedule.findById(request.scheduleId);
    if (!schedule) return res.status(404).json({ message: 'Schedule not found' });

    const slot = schedule.slots?.[request.slotIndex];
    if (!slot) return res.status(400).json({ message: 'Invalid slot' });

    if (slot.isBooked && slot.bookedBy?.toString() !== patientId.toString()) {
      return res.status(400).json({ message: 'Slot already booked by another user' });
    }

    request.paymentStatus = 'paid';
    request.status = 'accepted';
    request.paymentId = razorpay_payment_id;
    request.paymentSignature = razorpay_signature;

    slot.isBooked = true;
    slot.bookedBy = patientId;
    slot.requestId = request._id;

    await request.save();
    await schedule.save();

    return res.status(200).json({
      success: true,
      message: 'Payment verified and appointment confirmed',
      data: { requestId: request._id },
    });
  } catch (err) {
    console.error('Error verifying appointment payment:', err);
    return res.status(500).json({ message: 'Failed to verify payment', error: err.message });
  }
};

const updateSlotRequestStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const request = await SlotRequest.findById(requestId);
    if (!request) return res.status(404).json({ message: "Request not found" });

    const schedule = await Schedule.findById(request.scheduleId);
    if (!schedule) return res.status(404).json({ message: "Schedule not found" });

    const slot = schedule.slots[request.slotIndex];
    if (!slot) return res.status(400).json({ message: "Invalid slot" });

    request.status = status;
    if (status === 'accepted') {
      request.paymentStatus = 'unpaid';
      slot.isBooked = true;
      slot.bookedBy = request.patientId;
    } else {
      slot.requestId = null;
    }

    await request.save();
    await schedule.save();

    res.json({ success: true, message: `Request ${status}` });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update request', error: err.message });
  }
};

const getMyAppointments = async (req, res) => {
  try {
    console.log('=== GET MY APPOINTMENTS ===');
    console.log('req.client:', req.client);
    console.log('req.doctor:', req.doctor);

    let query = {};
    let appointments = [];

    // If client is logged in, get their appointments
    if (req.client) {
      console.log('Fetching appointments for client:', req.client._id);
      query = { patientId: req.client._id };
      
      appointments = await SlotRequest.find(query)
        .populate('doctorId', 'name specialization licenseNumber verified avatar')
        .populate('scheduleId')
        .sort({ createdAt: -1 });

      appointments = appointments.map((appointment) => {
        const appointmentObject = appointment.toObject();
        return {
          ...appointmentObject,
          doctorId: normalizeDoctor(appointmentObject.doctorId, req),
        };
      });

      console.log('Found appointments:', appointments.length);
    }
    // If doctor is logged in, get appointments scheduled with them
    else if (req.doctor) {
      console.log('Fetching appointments for doctor:', req.doctor._id);
      const schedules = await Schedule.find({ doctorId: req.doctor._id }).select('_id');
      const scheduleIds = schedules.map((schedule) => schedule._id);
      query = {
        $or: [
          { doctorId: req.doctor._id },
          { scheduleId: { $in: scheduleIds } }
        ]
      };
      
      appointments = await SlotRequest.find(query)
        .populate('scheduleId')
        .sort({ createdAt: -1 });

      const missingPatientIds = appointments
        .map((appointment) => appointment.patientId)
        .filter(Boolean);

      const [clients, users] = await Promise.all([
        Client.find({ _id: { $in: missingPatientIds } }).select('name email phone avatar'),
        User.find({ _id: { $in: missingPatientIds } }).select('name email phone profilePicture')
      ]);

      const patientLookup = new Map();
      [...clients, ...users].forEach((patient) => {
        patientLookup.set(patient._id.toString(), patient);
      });

      appointments = appointments.map((appointment) => {
        const appointmentObject = appointment.toObject();
        const patientId = appointmentObject.patientId?._id || appointmentObject.patientId;
        const normalizedPatient =
          patientId && patientLookup.has(patientId.toString())
            ? normalizePatient(patientLookup.get(patientId.toString()), req)
            : appointmentObject.patientId;

        return {
          ...appointmentObject,
          patientId: normalizedPatient || null,
        };
      });

      console.log('Found appointments for doctor:', appointments.length);
    } else {
      return res.status(401).json({ 
        success: false,
        message: 'Unauthorized: User not found' 
      });
    }

    res.status(200).json({
      success: true,
      data: { appointments }
    });
  } catch (err) {
    console.error('Error in getMyAppointments:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch appointments', 
      error: err.message 
    });
  }
};

const getDoctorAppointments = async (req, res) => {
  try {
    if (!req.doctor?._id) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Doctor not found'
      });
    }

    const schedules = await Schedule.find({ doctorId: req.doctor._id }).select('_id');
    const scheduleIds = schedules.map((schedule) => schedule._id);

    let appointments = await SlotRequest.find({
      $or: [
        { doctorId: req.doctor._id },
        { scheduleId: { $in: scheduleIds } }
      ]
    })
      .populate('scheduleId')
      .sort({ createdAt: -1 });

    const patientIds = appointments.map((appointment) => appointment.patientId).filter(Boolean);
    const [clients, users] = await Promise.all([
      Client.find({ _id: { $in: patientIds } }).select('name email phone avatar'),
      User.find({ _id: { $in: patientIds } }).select('name email phone profilePicture')
    ]);

    const patientLookup = new Map();
    [...clients, ...users].forEach((patient) => {
      patientLookup.set(patient._id.toString(), patient.toObject ? patient.toObject() : patient);
    });

    appointments = appointments.map((appointment) => {
      const appointmentObject = appointment.toObject();
      const patientId = appointmentObject.patientId?._id || appointmentObject.patientId;

      return {
        ...appointmentObject,
        patientId: patientId ? normalizePatient(patientLookup.get(patientId.toString()), req) || null : null,
      };
    });

    return res.status(200).json({
      success: true,
      data: { appointments }
    });
  } catch (err) {
    console.error('Error in getDoctorAppointments:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch doctor appointments',
      error: err.message
    });
  }
};

const deleteAppointment = async (req, res) => {
  try {
    const { requestId } = req.params;
    const request = await SlotRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    const isClientOwner =
      req.client && request.patientId?.toString() === req.client._id?.toString();
    const isDoctorOwner =
      req.doctor && request.doctorId?.toString() === req.doctor._id?.toString();

    if (!isClientOwner && !isDoctorOwner) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this appointment' });
    }

    const schedule = await Schedule.findById(request.scheduleId);
    if (schedule && schedule.slots?.[request.slotIndex]) {
      const slot = schedule.slots[request.slotIndex];

      if (slot.requestId?.toString() === request._id.toString()) {
        slot.requestId = null;
      }
      if (slot.bookedBy?.toString() === request.patientId?.toString()) {
        slot.bookedBy = null;
      }

      slot.isBooked = false;
      await schedule.save();
    }

    await SlotRequest.findByIdAndDelete(requestId);

    return res.status(200).json({
      success: true,
      message: 'Appointment deleted successfully',
    });
  } catch (err) {
    console.error('Error deleting appointment:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete appointment',
      error: err.message,
    });
  }
};

module.exports = {
  requestSlot,
  createPaymentOrder,
  verifyPaymentAndConfirm,
  updateSlotRequestStatus,
  getMyAppointments,
  getDoctorAppointments,
  deleteAppointment,
};
