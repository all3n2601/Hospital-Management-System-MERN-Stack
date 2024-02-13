const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const Doctor = require("../models/doctor");
const checkAdmin = require("../middlewares/checkAdmin");

router.get("/get-doctors", async (req, res) => {

    try {
      const doctors = await Doctor.find();
      res.json(doctors);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.put("/update-doctor/:id", async (req, res) => {
    const { name, email, specialization } = req.body;
    try {
  
      const updatedUser = {
        name,
        email,
        specialization
      };
  
      const user = await Doctor.findByIdAndUpdate(req.params.id, updatedUser);
  
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.delete("/delete-doctor/:id", async (req, res) => {
    const userId = req.params.id;
    try {
      const user = await Doctor.findByIdAndDelete(userId);
      res.json({ msg: "Doctor deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });


router.post("/add-doctor", async (req, res) => {
  const { name, email ,specialization } = req.body;
  try {
    const existingUser = await Doctor.findOne({ email });

    if (existingUser) {
      return res
        .status(400)
        .json({ error: "Doctor with this email already exists" });
    }
    const lastDoctor = await Doctor.findOne().sort({ doctorId: -1 });
    let doctorId;
    if (lastDoctor) {
      const lastDoctorId = parseInt(lastDoctor.doctorId, 10);
      doctorId = (lastDoctorId + 1).toString();
    } else {
      doctorId = "1";
    }
    const firstemail = email.split('@')[0];
    const password = firstemail + '@123' ;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new Doctor({
      name,
      email,
      doctorId:doctorId,
      password: hashedPassword,
      specialization
    });

    const savedUser = await newUser.save();

    res.json(savedUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

  module.exports = router;