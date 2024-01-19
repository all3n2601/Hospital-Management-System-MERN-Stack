const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");
const User = require("../models/user.js");
const config = require("config");


const verifyUser = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
      return res.json("The Token is Not Available");
    } else {
      jwt.verify(token, "jwt-secret-key", (err, decoded) => {
        if (err) {
          return res.json("The Token is Not Valid");
        } else {
          req.email = decoded.email;
          req.username = decoded.username;
          next();
        }
      });
    }
  };
  
  router.get("/", verifyUser, (req, res) => {
    return res.json({ email: req.email, username: req.username });
  });
  
  router.post("/register", async (req, res) => {
    const { userName, email, password } = req.body;
    try {
      const existingUser = await User.findOne({ email });
  
      if (existingUser) {
        return res
          .status(400)
          .json({ error: "User with this email already exists" });
      }
  
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
  
      const newUser = new User({
        userName,
        email,
        password: hashedPassword,
      });
  
      const savedUser = await newUser.save();
  
      res.json(savedUser);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  router.post("/login", async (req, res) => {
    const { email, password } = req.body;
  
    try {
      const user = await User.findOne({ email });
  
      if (user) {
        const isPasswordValid = await bcrypt.compare(password, user.password);
  
        if (isPasswordValid) {
          const token = jwt.sign({ id: user._id, role: user.role }, config.get("jwtsecret"), {
            expiresIn: "2d",
          });
          res.cookie('token', token)
          return res.json({ status: "Success", token, role: user.role });
        }
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  router.get("/logout", (req, res) => {
    res.clearCookie("token");
    res.json({ message: "User Logged Out" });
  });

    // router.post("/google-login", async (req, res) => {
  //   const { tokenId } = req.body;
  
  //   try {
  //     const response = await client.verifyIdToken({
  //       idToken: tokenId,
  //       audience: config.get("googleClientId"),
  //     });
  
  //     const { email_verified, email } = response.payload;
  
  //     if (email_verified) {
  //       const user = await mySchemas.User.findOne({ email });
  
  //       if (user) {
  //         const token = jwt.sign({ id: user._id }, config.get("jwtsecret"), {
  //           expiresIn: "2d",
  //         });
  
  //         return res.json({ token });
  //       } else {
  //         const newUser = new mySchemas.User({
  //           email,
  //         });
  
  //         const savedUser = await newUser.save();
  
  //         const token = jwt.sign({ id: savedUser._id }, config.get("jwtsecret"), {
  //           expiresIn: "2d",
  //         });
  
  //         return res.json({ token });
  //       }
  //     }
  //   } catch (error) {
  //     res.status(500).json({ error: "Internal Server Error" });
  //   }
  // });

module.exports = router;
