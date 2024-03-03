const express = require("express");
const router = express.Router();
const User = require("../models/user");
const ContactUs = require("../models/contactUs");

router.post("/add-contact-us", async (req, res) => {
  const { name, phone, email, message } = req.body;

  try {
    const newContactUs = new ContactUs({
      name,
      phone,
      email,
      message,
    });

    const savedContactUs = await newContactUs.save();

    res.json(savedContactUs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/profile-update", async (req, res) => {
  const { userId, updatedProfile } = req.body;
  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updatedProfile },
      { new: true, runValidators: true }
    );

    res.status(200).json({ status: "Success", user: updatedUser });
  } catch (error) {
    console.error("Error updating profile:", error.message);
  }
});

router.get("/get-medications/:userId", async (req, res) => {
  const userId = req.params.userId;
  try {
    const user = await User.findById(userId);
    if (user.medications != null) {
      res.status(200).json(user.medications);
    } else {
      res.status(200).json([]);
    }
  } catch (error) {
    res.status(500).json({ error: "Error!" });
  }
});

router.post('/add-medications/:userEmail', async (req, res) => {
  try {
    const { userEmail } = req.params;
    const { name, dosage, frequency } = req.body;


    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.medicalHistory.push({
      medications: [{ name, dosage, frequency }],
    });

    await user.save();

    res.status(201).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});


module.exports = router;
