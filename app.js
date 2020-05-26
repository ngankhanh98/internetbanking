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


const router = express.Router();

app.use(
  "/",
  router.get("/", (req, res) => {
    res.send("Hello from NKLBank API");
  })
);
app.use("/api/partnerbank", require("./routes/partnerbank.route"));
app.use('/client/mpbank', require("./routes/client.mpbank.route"));
app.use('/client/s2pbank', require("./routes/client.s2qbank.route"));


app.use((req, res, next) => {
  res.status(404).send("NOT FOUND");
});

app.use(function (err, req, res, next) {
  const code = err.code || 500;
  console.log(code, err.message);
  res.status(code).send(err.message);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, (_) => {
  console.log(`API is running at http://localhost:${PORT}`);
});
