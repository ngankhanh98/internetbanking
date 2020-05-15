const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const jwt = require("jsonwebtoken");
const createError = require("https-error");
require("express-async-errors");

const app = express();
app.use(morgan("dev"));
app.use(cors());
app.use(express.json());

app.use("/api/auth", require("./routes/auth.route"));

function verify(req, res, next) {
  const token = req.headers["x-access-token"];
  if (token) {
    jwt.verify(token, "secretKey", function (err, payload) {
      if (err) throw new createError(401, err);

      console.log(payload);
      next();
    });
  } else {
    throw new createError(401, "No access token found");
  }
}

//app.use("/api/customer", verify, require("./routes/customer.route"));
app.use("/api/customer", require("./routes/customer.route"));

app.use((req, res, next) => {
  res.status(404).send("NOT FOUND");
});

app.use(function (err, req, res, next) {
  const code = err.code || 500;
  console.log(code, err.message);
  res.status(code).send(err.message);
});

const PORT = 3000;
app.listen(PORT, (_) => {
  console.log(`API is running at http://localhost:${PORT}`);
});
