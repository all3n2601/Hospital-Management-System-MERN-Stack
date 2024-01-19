const express = require("express");
const router = express.Router();
const Appointment = require("../models/appointment");
const checkAccess = require("../middlewares/checkAccess");

router.get("/get-appointments", async (req, res) => {
    try {
      const appointments = await Appointment.find({});
  
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

router.post("/add-appointment", async (req, res) => {
  const {doctorId , patientId, appointmentDate,reason,status} = req.body;

  try {
    const newAppointment = new Appointment({
      doctor: doctorId,
      patient: patientId,
      appointmentDate: appointmentDate,
      reason,
      status,
    });

    const savedAppointment = await newAppointment.save();
    res.json(savedAppointment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }


});

module.exports = router;
