const mongoose = require("mongoose");

const slotRequestSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  scheduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Schedule', required: true },
  slotIndex: { type: Number, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  fee: { type: Number, required: true },
  status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
  paymentStatus: { type: String, enum: ["unpaid", "paid"], default: "unpaid" },
  paymentOrderId: { type: String, default: null },
  paymentId: { type: String, default: null },
  paymentSignature: { type: String, default: null },
}, { timestamps: true });

const SlotRequest = mongoose.model("SlotRequest", slotRequestSchema);
module.exports = SlotRequest;
