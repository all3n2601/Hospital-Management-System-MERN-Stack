const mongoose = require("mongoose");

const contactUsSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
      },
      phone: {
        type: Number,
        required: true,
      },
      email: {
        type: String,
      },
      message: {
        type: String,
        required: true,
      },
});

const ContactUs = mongoose.model("Contact", contactUsSchema, "contactus");
module.exports = ContactUs;
