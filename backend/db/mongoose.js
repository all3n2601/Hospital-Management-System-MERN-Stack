const mongoose = require("mongoose");
require("dotenv/config");

const dbOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};
const connectToDatabase = async () => {
  try {
    await mongoose.connect("mongodb+srv://allen:allen123@hospitalmanagement.5xqhhe4.mongodb.net/HospitalManagement", dbOptions);
    console.log("DB Connected!");
  } catch (error) {
    console.error("Error connecting to the database:", error.message);
    throw error;
  }
};


module.exports = connectToDatabase;
