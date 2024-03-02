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
        default:"",
        unique: false,
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
