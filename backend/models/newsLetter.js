const mongoose = require("mongoose");

const newsletterSchema = new mongoose.Schema({
      email: {
        type: String,
      },
});

const newsLetter = mongoose.model("newsLetter", newsletterSchema, "newsletter");
module.exports = newsLetter;
