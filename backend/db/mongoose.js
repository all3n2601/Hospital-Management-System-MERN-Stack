const mongoose = require("mongoose");
require("dotenv/config");

const dbOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

const connectToDatabase = async () => {
  try {
    await mongoose.connect(process.env.DB_URI, dbOptions);
    console.log("DB Connected!");
  } catch (error) {
    console.error("Error connecting to the database:", error.message);
    throw error;
  }
};


module.exports = connectToDatabase;
