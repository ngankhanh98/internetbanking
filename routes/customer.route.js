const express = require("express");
const customerModel = require("../models/customer.model");
const createError = require("https-error");

const router = express.Router();

router.get("/", async (req, res) => {
  const rows = await customerModel.all();
  res.json(rows);
});

router.post("/add", async (req, res) => {
  var result;
  try {
    result = await customerModel.add(req.body);
  } catch (error) {
    throw new createError(401, error.message);
  }

  res.status(201).json(result);
});

router.post("/update", async (req, res) => {

  try {
    const rows = await customerModel.detail(req.body.username);
  } catch (error) {
    throw new createError(401, error.message);
  }

  try {
    result = await customerModel.update(req.body);
  } catch (error) {
    throw new createError(401, error.message);
  }

  res.status(200).json(result);
});


module.exports = router;
