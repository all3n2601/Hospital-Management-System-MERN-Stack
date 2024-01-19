const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");
const { User, Doctor, Nurse, Appointment, ContactUs } = require("../models");

const config = require("config");

// const { OAuth2Client } = require("google-auth-library");

// const client = new OAuth2Client(config.get("googleClientId"));






