const express = require("express");
const router = express.Router();
const Appointment = require("../models/appointment");
const checkAccess = require("../middlewares/checkAccess");

router.get("/get-appointments/:email", async (req, res) => {
  const { email } = req.params;
  try {
    const appointment = await Appointment.find({email}).populate("doctor");
    if (appointment == null) {
      res.json({ message: "No Appointments Booked!" });
    } else {
      res.json(appointment);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/get-appointment/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const appointments = await Appointment.find({ doctor: id })

    if (appointments.length === 0) { 
      res.json({ message: "No Appointments Booked!" });
    } else {
      res.json(appointments);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.post("/add-appointment", async (req, res) => {
  const { doctor, patient, appointmentDate, reason, phone,email,time } = req.body;

  try {
    const newAppointment = new Appointment({
      doctor,
      patient,
      appointmentDate ,
      reason,
      phone,
      email,
      time
    });

    const savedAppointment = await newAppointment.save();
    res.status(200).json(savedAppointment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
