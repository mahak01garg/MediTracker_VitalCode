// controllers/scheduleController.js
const Schedule = require("../models/schedule.model.js");

const createSchedule = async (req, res) => {
  try {
    const { date, slots } = req.body;
    const doctorId = req.doctor._id;

    if (!date) {
      return res.status(400).json({ message: 'date is required' });
    }

    const normalizedSlots = Array.isArray(slots)
      ? slots
          .filter((slot) => slot?.time && Number(slot?.fee) >= 0)
          .map((slot) => ({
            time: String(slot.time).trim(),
            fee: Number(slot.fee),
            isBooked: Boolean(slot.isBooked),
            bookedBy: slot.bookedBy || null,
            requestId: slot.requestId || null,
          }))
      : [];

    const schedule = await Schedule.findOneAndUpdate(
      { doctorId, date },
      {
        doctorId,
        date,
        slots: normalizedSlots
      },
      {
        upsert: true,
        new: true,
        runValidators: true
      }
    );

    res.status(201).json({ success: true, schedule });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create schedule', error: err.message });
  }
};

const getDoctorSchedule = async (req, res) => {
  try {
    const { doctorId, date } = req.query;

    if (!doctorId || !date) {
      return res.status(400).json({ message: 'doctorId and date are required' });
    }

    const schedule = await Schedule.findOne({ doctorId, date });

    if (!schedule) {
      return res.status(404).json({ message: 'No schedule found for this date' });
    }

    res.json({ success: true, data: { schedule } });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching schedule', error: err.message });
  }
};

module.exports = { createSchedule, getDoctorSchedule };
