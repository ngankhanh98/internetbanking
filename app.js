const express = require("express");
// const cors = require("cors");
// const morgan = require("morgan");
// const jwt = require("jsonwebtoken");
// const createError = require("https-error");
// require("express-async-errors");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    msg: "hello from nodejs express api",
  });
});

const PORT = 3000;
app.listen(PORT, (_) => {
  console.log(`API is running at http://localhost:${PORT}`);
});
