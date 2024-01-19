const express = require("express");
const router = express.Router();
const checkAdmin = require("../middlewares/checkAdmin");

const User = require("../models/user");
const Department = require("../models/department")
const ContactUs = require("../models/contactUs")

router.get("/get-users", async(req, res) => {
    try {
      const users = await User.find({});
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
});

router.delete("/delete-user/:id", async (req, res) => {
    try {
      const deletedUser = await User.findByIdAndDelete(req.params.id);
      res.json(deletedUser);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
});

router.get("/get-contacts", async(req, res) => {
    try {
      const contacts = await ContactUs.find({});

      res.json(contacts);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
});

router.post("/add-department", async (req, res) => {
  const { name, description, head, staff } = req.body;
    try {
      const existingdept = await Department.findOne({ name });
  
      if (existingdept) {
        return res
          .status(400)
          .json({ error: "Department with same name already exists" });
      }
      const newDept = new Department({
        name,
        description,
        head,
        staff
      });
  
      const savedDept = await newDept.save();
      res.json(savedDept);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
});

router.delete("/delete-department/:id", async (req, res) => {
  try {
    const deletedDept = await Department.findByIdAndDelete(req.params.id);
    res.json(deletedDept);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/get-department", async (req, res) => {
  try {
    const depts = await Department.find({}).populate("head" ,"name");
    depts
    res.json(depts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.get("/count-all", async (req, res) => {

  try {
    const users = await User.find({});
    const contacts = await ContactUs.find({});
    const depts = await Department.find({});
    res.json({users:users.length, contacts:contacts.length, depts:depts.length});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }

});

module.exports=router;
