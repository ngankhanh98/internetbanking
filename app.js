const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const createError = require("https-error");
require("express-async-errors");

const app = express();
app.use(morgan("dev"));
app.use(cors());
app.use(express.json());

const router = express.Router();

const { verify } = require('./middlewares/verify.mdw');
app.use(
  "/",
  router.get("/", (req, res) => {
    res.send("Hello from NKLBank API");
  })
);

app.use("/api/auth", require("./routes/auth.route"));

app.use("/", router);
// app.use("/api/customer", verify, require("./routes/customer.route"));
app.use("/api/customer", require("./routes/customer.route"));
app.use("/api/employee", require("./routes/employee.route"));

// app.use("/api/account", verify, require("./routes/account.route"));
app.use("/api/account",  require("./routes/account.route"));
app.use('/api/beneficiary', require('./routes/beneficiary.route'))
app.use("/api/notifs", require('./routes/notifs.route'))

app.use("/api/partnerbank", require("./routes/partnerbank.route"));

// app.use("/api/admin", verify, require("./routes/admin.route"));
app.use("/api/admin",  require("./routes/admin.route"));





app.use((req, res, next) => {
  res.status(404).send("NOT FOUND");
});

app.use(function (err, req, res, next) {
  const code = err.code || 500;
  console.log(code, err.message);
  res.status(code).send(err.message);
});

module.exports = app;
