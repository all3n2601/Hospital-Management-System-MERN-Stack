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
        default:"",
      },
      dob: {
        type: Date,
        
      },
      gender:{
        type: String,
      },
      address:{
        city: {
          type: String,
        },
        state: {
          type: String,
        },
        street: {
          type: String,
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
