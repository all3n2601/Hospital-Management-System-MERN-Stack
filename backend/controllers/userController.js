const express = require("express");
const router = express.Router();
const { User,ContactUs } = require("../models/user");

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

  router.get("/profile", async (req, res) => {
    const{userId , email} = req.query;
  });

  router.put("/profile-update",async(req,res)=>{
    const { email, updatedProfile } = req.body;
    try {
      const updatedUser = await User.findByIdAndUpdate(
        email,
        { $set: updatedProfile },
        { new: true, runValidators: true }
      );
  
      res.status(200).json({ status: "Success", user: updatedUser });
    } catch (error) {
      console.error("Error updating profile:", error.message);
    }
  });


  module.exports = router;