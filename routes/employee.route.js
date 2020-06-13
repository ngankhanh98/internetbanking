const express = require("express");
const customerModel = require("../models/customer.model");

const router = express.Router();

router.post("/add-customer", async (req, res) => {
  var result;

  var { fullname } = req.body;
  fullname = fullname
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
  const standarlize = (req_body) => ({
    ...req_body,
    fullname: fullname, // Lê Long Đỉnh --> LE LONG DINH
  });
  const entity = standarlize(req.body);
  console.log(`add customer: ${JSON.stringify(entity)}`);
  try {
    result = await customerModel.add(entity);
  } catch (error) {
    throw new createError(401, error.message);
  }
  res.status(201).json(result);
});

router.post("/add-account", async (req, res) => {});

module.exports = router;
