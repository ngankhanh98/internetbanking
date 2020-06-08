const express = require("express");
const customerModel = require("../models/customer.model");
const accountModel = require("../models/account.model");
const beneficiaryModel = require("../models/beneficiaries.model");
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
  res.status(200).json(rows);
});

router.get("/accounts", async (req, res) => {
  // req.headers {x-access-token}
  const token = req.headers["x-access-token"];
  const decode = jwt.decode(token);
  const { username } = decode;
  try {
    const rows = await customerModel.getAccounts(username);
    res.status(200).json(rows);
  } catch (error) {
    res.status(401).json(error);
  }
});

router.post("/add-beneficiary", async (req, res) => {
  // req.headers {x-access-token}
  // req.body {account_number}
  const token = req.headers["x-access-token"];
  const decode = jwt.decode(token);
  const { username } = decode;

  const { account_number, name } = req.body;

  const beneficiary = await customerModel.getByAccountNumber(account_number);
  if (beneficiary.length === 0)
    res.status(403).json({"msg":"Not found such beneficiary account"});

  var _name = name || beneficiary[0].fullname;

  try {
    const ret = await beneficiaryModel.add({
      customer_username: username,
      beneficiary_account: account_number,
      beneficiary_name: _name,
    });
    res.status(200).json(ret);
  } catch (error) {
    res.status(401).json(error);
  }
});

// permission: personels only
router.post("/add", async (req, res) => {
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
