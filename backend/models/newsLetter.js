const mongoose = require("mongoose");

const newsletterSchema = new mongoose.Schema({
      subject: {
        type: String,
        required:true
      },
      message:{
        type:String,
        required:true
      }
});

const newsLetter = mongoose.model("newsLetter", newsletterSchema, "newsletter");
module.exports = newsLetter;
