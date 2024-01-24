const express = require("express");
const bodyParser = require("body-parser");
const corsMiddleware = require("./middlewares/cors");
const errorHandlerMiddleware = require("./middlewares/errorHandler");
const connectToDatabase = require("./db/mongoose");
const authController = require("./controllers/authController");
const userController = require("./controllers/userController");
const doctorController = require("./controllers/doctorController");
const nurseController = require("./controllers/nurseController");
const appointmentController = require("./controllers/appointmentController");
const adminController = require("./controllers/adminController");
const router = express.Router();
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(corsMiddleware);

app.use("/auth", authController);
app.use("/user", userController);
app.use("/doctor", doctorController);
app.use("/nurse", nurseController);
app.use("/appointment", appointmentController);
app.use("/admin", adminController);
app.use(errorHandlerMiddleware);

(async () => {
  try {
    await connectToDatabase();
    const port = process.env.PORT || 4451;
    const server = app.listen(port, () => {
      console.log(`Server running on port: ${port}`);
    });
  } catch (error) {
    console.error("Failed to start the server:", error.message);
  }
})();
