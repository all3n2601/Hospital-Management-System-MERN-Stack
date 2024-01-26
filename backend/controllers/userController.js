const express = require("express");
const router = express.Router();
const User  = require("../models/user");
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

  router.get("/sign-out", async (req, res) => {
    res.clearCookie("token").json("User signed out successfully");
  
  });

  router.put("/profile-update",async(req,res)=>{
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


  module.exports = router;