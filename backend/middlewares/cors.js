const cors = require("cors");

const corsOptions = {
  origin: "*",
  credentials: true,
  optionSuccessStatus: 200,
};

module.exports = cors(corsOptions);
