const express = require("express");
const customerModel = require("../models/customer.model");
const createError = require("https-error");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const router = express.Router();

router.get("/", async (req, res) => {
  // req.headers {x-access-token}
  const token = req.headers["x-access-token"];
  const decode = jwt.decode(token);
  const { username } = decode;
  const rows = await customerModel.detail(username);
  res.json(rows);
});

// permission: personels only
router.post("/add", async (req, res) => {
  var result;
  try {
    result = await customerModel.add(req.body);
  } catch (error) {
    throw new createError(401, error.message);
  }

  res.status(201).json(result);
});

// permission: personels, customers
router.post("/update", async (req, res) => {
  const token = req.headers["x-access-token"];
  const decode = jwt.decode(token);

  const username = decode.username;
  try {
    const result = await customerModel.update(req.body, username);
    res.status(200).json(result);
  } catch (error) {
    throw new createError(401, error.message);
  }
});

module.exports = router;
