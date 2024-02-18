const mongoose = require("mongoose");

const nurseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
        unique: true,
      },
      password: {
        type: String,
        required: true,
      },
      phoneno: {
        type: String,
        required: true,
        unique: true,
      },
      dob: {
        type: Date,
        required: true,
        
      },
      gender:{
        type: String,
        required: true,
      },
      address:{
        city: {
          type: String,
          required: true,
        },
        state: {
          type: String,
          required: true,
        },
        street: {
          type: String,
          required: true,
        },
      },
      ward: {
        type: String,
        default: "General",
      },
      department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department",
      },
      role: {
        type: String,
        enum: ["admin", "doctor", "nurse", "receptionist", "patient"],
        default: "nurse",
      },
});

const Nurse = mongoose.model("Nurse", nurseSchema, "nurses");
module.exports = Nurse;
