const express = require("express");
const beneficiaryModel = require("../models/beneficiaries.model");
const customerModel = require("../models/customer.model");
const createError = require("https-error");
const jwt = require("jsonwebtoken");
const router = express.Router();

router.get("/", async (req, res) => {
  const token = req.headers["x-access-token"];
  const decode = jwt.decode(token);

  const username = decode.username;
  var rows;
  try {
    rows = await beneficiaryModel.getAllByUsername(username);
    // res.status(200).json(result);
  } catch (error) {
    throw new createError(401, error.message);
  }
  let key = 1;
  const result = rows.map(
    (elem, key) => (new_elem = { ...elem, key: key + 1 })
  );
  res.status(200).json(result);
});

router.post("/", async (req, res) => {
  // req.headers {x-access-token}
  // req.body {account_number, name (optional), bank (optional)}
  const token = req.headers["x-access-token"];
  const decode = jwt.decode(token);
  const { username } = decode;
  console.log("req.body", req.body);
  const { beneficiary_account, name, bank } = req.body;

  // check if beneficiary_account in user's bene list
  const benes = await beneficiaryModel.getAllByUsername(username);
  const isExist = benes.filter((bene) => {
    bene.beneficiary_account === beneficiary_account &&
      bene.partner_bank === bank;
  });

  if (isExist.length > 0) {
    return res
      .status(401)
      .json({ msg: "Account existed in list beneficiaries" });
  }

  var account_info;
  if (bank) {
    try {
      account_info = await partnerbank.getAccountInfo(
        bank,
        beneficiary_account
      );
    } catch (error) {
      return res.status(403).json({ msg: error.message });
    }
  } else {
    try {
      account_info = await customerModel.getByAccountNumber(
        beneficiary_account
      );
      if (!account_info)
        return res.status(403).json({ msg: "From nklbank: Account not found" });
    } catch (error) {
      return res.status(403).json(error);
    }
  }

  const { fullname } = account_info;

  const _name = name || fullname;
  try {
    const ret = await beneficiaryModel.add({
      customer_username: username,
      beneficiary_account: beneficiary_account,
      beneficiary_name: _name,
      partner_bank: bank,
    });
    res.status(200).json({ beneficiary_account, name: _name, bank });
  } catch (error) {
    res.status(401).json(error);
  }
});

router.put("/", async (req, res) => {
  // req.headers {x-access-token}
  // req.body {beneficiary_account, name}
  const token = req.headers["x-access-token"];
  const decode = jwt.decode(token);
  const { username } = decode;
  const { beneficiary_account, name } = req.body;

  try {
    const ret = await beneficiaryModel.update(
      username,
      beneficiary_account,
      name
    );
    res.status(200).json({ msg: "Changes saved" });
  } catch (error) {
    console.log(error);
    return res.status(401).json(error);
  }
});

router.delete("/:beneficiary_account", async (req, res) => {
  const token = req.headers["x-access-token"];
  const decode = jwt.decode(token);
  const { username } = decode;
  const { beneficiary_account } = req.params;

  try {
    await beneficiaryModel.del(username, beneficiary_account);
    res.status(200).json({ msg: "Delected successfully" });
  } catch (error) {
    console.log(error);
    return res.status(401).json(error);
  }
});

module.exports = router;
