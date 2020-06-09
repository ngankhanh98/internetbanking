const express = require("express");
const customerModel = require("../models/customer.model");
const accountModel = require("../models/account.model");
const beneficiaryModel = require("../models/beneficiaries.model");
const createError = require("https-error");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mpbank = require("../middlewares/mpbank.mdw");
const s2qbank = require("../middlewares/s2qbank.mdw");
const router = express.Router();
const mailer = require("../utils/Mailer");
const otp = require("../utils/otp")

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
  // req.body {account_number, name (optional), bank (optional)}
  const token = req.headers["x-access-token"];
  const decode = jwt.decode(token);
  const { username } = decode;

  const { account_number, name, bank } = req.body;

  var beneficiary, ref_name;
  try {
    switch (bank) {
      case "mpbank":
        beneficiary = await mpbank.getAccountInfo(account_number);
        ref_name = beneficiary.result;
        break;
      case "s2qbank":
        beneficiary = await s2qbank.getAccountInfo(account_number);
        ref_name = beneficiary.username;
        break;
      default:
        beneficiary = await customerModel.getByAccountNumber(account_number);
        ref_name = beneficiary.fullname;
        break;
    }
    if (beneficiary == undefined || beneficiary.name == "Error")
      res.status(403).json({ msg: "1. Not found such account" });
  } catch (error) {
    // only mpbank + nklbank throw error
    console.log(`error: ${error}`);
    res.status(403).json({ msg: "Not found such account" });
  }

  var _name = name || ref_name;
  console.log(`ref_name: ${ref_name}`);
  try {
    const ret = await beneficiaryModel.add({
      customer_username: username,
      beneficiary_account: account_number,
      beneficiary_name: _name,
      partner_bank: bank
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

router.get("/beneficiary-account", async (req, res) => {
  // req.headers {x-access-token}
  const token = req.headers["x-access-token"];
  const decode = jwt.decode(token);
  const { username } = decode;
  const rows = await customerModel.detail(username);
  res.status(200).json(rows);
});


router.get("/beneficiary-account/:accountnumber", async (req, res) => {
  const token = req.headers["x-access-token"];
  const decode = jwt.decode(token);
  const { username } = decode;
  console.log(username)
  try {
    const AccNumber = req.params;
    const rows = await beneficiaccountModel.getByAccNumber(AccNumber);
    res.status(200).json(rows);
  } catch (error) {
    res.status(401).json(error);
  }
})

module.exports = router;
