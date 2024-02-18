const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
      },
      doctorId: {
        type: String,
        required: true,
        unique: true,
      },
      email: {
        type: String,
        required: true,
        unique: true,
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
      password: {
        type: String,
        required: true,
      },
      specialization: {
        type: String,
        required: true,
      },
      role: {
        type: String,
        enum: ["admin", "doctor", "nurse", "receptionist", "patient"],
        default: "doctor",
      },
});

const Doctor = mongoose.model("Doctor", doctorSchema, "doctors");
module.exports = Doctor;
