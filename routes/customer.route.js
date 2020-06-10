const express = require("express");
const customerModel = require("../models/customer.model");
const accountModel = require("../models/account.model");
const beneficiaryModel = require("../models/beneficiaries.model");
const transactionModel = require("../models/transaction.model");
const createError = require("https-error");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mpbank = require("../middlewares/mpbank.mdw");
const s2qbank = require("../middlewares/s2qbank.mdw");
const router = express.Router();

const { tariff } = require("../config/default.json");

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
    console.log(beneficiary);
    if (beneficiary == undefined || beneficiary.name == "Error")
      // s2qbank throw {Error:"..."}
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
      partner_bank: bank,
    });
    res.status(200).json(ret);
  } catch (error) {
    res.status(401).json(error);
  }
});

router.post("/intrabank-transfer-money", async (req, res) => {
  const { depositor, receiver, amount } = req.body;
  const transaction = req.body;

  // check beforehead whether: (1) depositor's balance is available for transfering
  // (2) receiver, in case of adding new (not from the list) is valid.
  const depositors = await accountModel.getByAccNumber(depositor);
  const { account_balance } = depositors[0];
  const receivers = await accountModel.getByAccNumber(receiver);

  if (account_balance < amount) {
    res.status(403).json({ msg: "Account balance not enough" });
  }
  if (receivers.length === 0) {
    res.status(403).json({ msg: "Receiver account not found" });
  }

  // store transaction
  var transaction_id;
  try {
    const ret = await transactionModel.add(transaction);
    transaction_id = ret.insertId;
    console.log(ret);
  } catch (error) {
    console.log(error);
    return error;
  }

  // proceed draw money
  const _depositor = {
    transaction_type: "-",
    target_account: depositor,
    amount_money: amount,
  };
  const _receiver = {
    transaction_type: "+",
    target_account: receiver,
    amount_money: amount,
  };
  try {
    await accountModel.drawMoney(_depositor);
  } catch (error) {
    await transactionModel.del(transaction_id);
    return error;
  }

  try {
    await accountModel.drawMoney(_receiver);
  } catch (error) {
    await transactionModel.del(transaction_id); // delete transaction record
    const revert_depositor = { ..._depositor, transaction_type: "+" }; // revert depositor balance
    await accountModel.drawMoney(revert_depositor);
    return error;
  }
  res.status(200).json({
    msg: `Transfer money succeed. Transaction stored at transaction_id = ${transaction_id}`,
  });
});

router.post("/interbank-transfer-money", async (req, res) => {
  const {
    depositor,
    receiver,
    amount,
    partner_bank,
    charge_include,
  } = req.body;
  const fee = tariff.transfer_fee;
  const depositor_pay = charge_include ? amount + fee : amount;
  const receiver_get = charge_include ? amount : amount - fee;
  const transaction = { ...req.body, amount: depositor_pay };

  // check if depositor's balance > money to transfer
  const depositors = await accountModel.getByAccNumber(depositor);
  const { account_balance } = depositors[0];
  if (account_balance < amount) {
    res.status(403).json({ msg: "Account balance not enough" });
  }

  // check if receiver valid (in case of add new, not from the list)
  var interbank_query;
  try {
    switch (partner_bank) {
      case "mpbank":
        interbank_query = await mpbank.getAccountInfo(receiver);
        break;
      case "s2qbank":
        interbank_query = await s2qbank.getAccountInfo(receiver);
        break;
    }
    if (interbank_query.name == "Error")
      // s2qbank throw {Error:"..."}
      res.status(403).json({ msg: "Not found such account" });
  } catch (error) {
    console.log(`error: ${error}`);
    res.status(403).json({ msg: "Not found such account" });
  }

  // store transaction
  var transaction_id;
  try {
    const ret = await transactionModel.add(transaction);
    transaction_id = ret.insertId;
    console.log(ret);
  } catch (error) {
    console.log(error);
    return error;
  }

  // procceed draw money
  const _depositor = {
    transaction_type: "-",
    target_account: depositor,
    amount_money: depositor_pay,
  };

  try {
    await accountModel.drawMoney(_depositor);
    console.log("nklbank 200");
  } catch (error) {
    await transactionModel.del(transaction_id);
    return error;
  }

  try {
    switch (partner_bank) {
      case "mpbank":
        await mpbank.transferMoney(receiver, receiver_get);
        console.log("mpbank 200");
        break;
      default:
        await s2qbank.transferMoney(receiver, receiver_get);
        console.log("s2qbank 200");
        break;
    }
  } catch (error) {
    await transactionModel.del(transaction_id);
    const revert_depositor = { ..._depositor, transaction_type: "+" };
    await accountModel.drawMoney(revert_depositor);
    console.log(error);
    return error;
  }

  res.status(200).json({
    msg: `Transfer money succeed. Transaction stored at transaction_id = ${transaction_id}`,
  });
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

router.get('/beneficiaries', async (req,res) => {
  const token = req.headers["x-access-token"];
  const decode = jwt.decode(token);

  const username = decode.username;
  try {
    const result = await beneficiaryModel.getAllByUsername(username);
    res.status(200).json(result);
  } catch (error) {
    throw new createError(401, error.message);
  }
})

router.get('/transactions/transfer', async (req,res) => {
  const account_number = req.body.account_number;
  try {
    const result = await transactionModel.getTransferByAccNumber(account_number);
    res.status(200).json(result);
  } catch (error) {
    throw new createError(401, error.message);
  }
})
router.get('/transactions/receiver', async (req,res) => {
  const account_number = req.body.account_number;
  try {
    const result = await transactionModel.getReceiverByAccNumber(account_number);
    res.status(200).json(result);
  } catch (error) {
    throw new createError(401, error.message);
  }
})
module.exports = router;
