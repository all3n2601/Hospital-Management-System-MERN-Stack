const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const Doctor = require("../models/doctor");
const checkAdmin = require("../middlewares/checkAdmin");

router.get("/get-doctors", async (req, res) => {
    try {
      const doctors = await Doctor.find({});
      res.json(doctors);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

router.post("/add-doctor", async (req, res) => {
    const { name, email, password, specialization } = req.body;
    try {
      const existingUser = await Doctor.findOne({ email });
  
      if (existingUser) {
        return res
          .status(400)
          .json({ error: "Doctor with this email already exists" });
      }
  
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
  
      const newUser = new Doctor({
        name,
        email,
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