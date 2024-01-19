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


  module.exports = router;