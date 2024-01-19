const express = require("express");
const router = express.Router();
const { Nurse } = require("../models/nurse");
const checkAdmin = require("../middlewares/checkAdmin");

router.get("/get-nurses", async (req, res) => {
    try {
      const nurses = await Nurse.find({});
  
      res.json(nurses);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

router.post("/add-nurse", async (req, res) => {
  // ... (rest of the code)
});

module.exports = router;
