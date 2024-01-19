const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const appointmentSchema = new Schema({
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Doctor",
    required: true,
  },
  patient: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  appointmentDate: {
    type: Date,
    required: true,
  },
  reason: {
    type: String,
  },
  status: {
    type: String,
    enum: ["scheduled", "inProgress", "completed", "cancelled"],
    default: "scheduled",
  },
  notes: {
    type: String,
  },
});

const Appointment = mongoose.model('Appointment', appointmentSchema, 'appointments');
module.exports = Appointment;