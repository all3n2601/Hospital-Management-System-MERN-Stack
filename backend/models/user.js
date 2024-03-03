const mongoose = require("mongoose");
const Schema = mongoose.Schema;


const medicationSchema = new Schema({
  name: {
    type: String,
  },
  dosage: {
    type: String,
  },
  frequency: {
    type: String,
  },
});

const medicalHistorySchema = new Schema({
  condition: {
    type: String,
    default:""
  },
  diagnosisDate: {
    type: Date,
  },
  treatment: {
    type: String,
  },
  medications: [medicationSchema],
});

const userSchema = new Schema({
    userName: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
      },
      password: {
        type: String,
        required: true,
      },
      role: {
        type: String,
        enum: ["admin", "doctor", "nurse", "receptionist", "patient"],
        default: "patient",
      },
      phoneNumber: {
        type: String,
        default: "",
      },
      dateOfBirth: {
        type: Date,
        default: "",
      },
      gender: {
        type: String,
        default: "",
      },
      address: {
        street: {
          type: String,
          default: "",
        },
        city: {
          type: String,
          default: "",
        },
        state: {
          type: String,
          default: "",
        },
        zipCode: {
          type: String,
          default: "",
        },
      },
      emergencyContact: {
        name: {
          type: String,
          default: "",
        },
        relationship: {
          type: String,
          default: "",
        },
        phoneNumber: {
          type: String,
          default: "",
        },
      },

  medicalHistory: { type: [medicalHistorySchema], default: [] },
});

const User = mongoose.model("User", userSchema, "users");
module.exports = User;