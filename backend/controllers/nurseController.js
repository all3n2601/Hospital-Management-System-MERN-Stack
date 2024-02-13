const express = require("express");
const router = express.Router();
const { Nurse } = require("../models/nurse");
const checkAdmin = require("../middlewares/checkAdmin");
const { error } = require("console");

router.get("/get-nurses", async (req, res) => {
    try {
      const nurses = await Nurse.find({});
  
      res.json(nurses);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

router.post("/add-nurse", async (req, res) => {
  const {name, email,password,ward} = req.body;

  try{
    const newNurse = new Nurse({
      name,
      email,
      password,
      ward
    });

    const savedNurse = await newNurse.save();
    res.json(savedNurse);
  }catch(err){
    res.status(500).json({error:err.message})
  }

});

module.exports = router;

