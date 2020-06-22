const express = require("express");
const customerModel = require("../models/customer.model");
const accountModel = require("../models/account.model");
const transactionModel = require('../models/transaction.model');
const createError = require("https-error");
const moment = require('moment');
const router = express.Router();

const { bank } = require("../config/default.json");
const { account_len } = bank;

router.post("/add-customer", async (req, res) => {
  var { fullname, username } = req.body;
  var result;

  fullname = fullname
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
  const standarlize = (req_body) => ({
    ...req_body,
    fullname: fullname, // Lê Long Đỉnh --> LE LONG DINH
  });
  const entity = standarlize(req.body);

  // add customer to table `customer`
  try {
    const ret = await customerModel.add(entity);
    const confirmed_info = await customerModel.detail(username);
    const info = { ...confirmed_info[0], password: null };
    result = { db: { ...ret }, customer: { ...info } };
  } catch (error) {
    throw new createError(401, error.message);
  }

  // genenerate and add a new random account to table `account`
  const account = {
    account_number: randomAccountNum(),
    type: 0, // tai khoan thanh toan default
    customer_username: username,
  };
  try {
    const ret = await accountModel.add(account);
    const new_account = await accountModel.getByAccNumber(
      account.account_number
    );

    result = { ...result, account: { ...new_account } };
  } catch (error) {
    throw new createError(401, error.message);
  }
  res.status(200).json(result);
});

router.post("/add-account", async (req, res) => {
  // const { account, type, customer_username } = req.body;

  const entity = { ...req.body };
  const { customer_username } = entity;

  try {
    const rows = await customerModel.detail(customer_username);
    if (rows.length === 0) res.status(403).json({ msg: "Customer not exist" });
  } catch (error) {
    throw error;
  }

  try {
    const ret = await accountModel.add(entity);
    res.status(200).json(ret);
  } catch (error) {
    throw new createError(401, error.message);
  }
});

router.post("/intrabank-deposit", async (req, res) => {
  const { receiver, amount } = req.body
  const timestamp = moment().format("YYYY-MM-DD HH:mm:ss");


  // ghi nhan giao dich
  var transactionId;
  try {
    transactionId = await transactionModel.add({ depositor: receiver, receiver, amount, timestamp });
    transactionId = transactionId.insertId;
    console.log('transactionId', transactionId)
  } catch (error) {
    throw new createError(401, 'Draw transaction failed')
  }

  // thuc hien giao dich
  try {
    await accountModel.drawMoney({ amount_money: amount, target_account: receiver });
    const result = await accountModel.getByAccNumber(receiver);
    console.log('result', result)
    const { account_number, account_balance } = result[0];
    res.status(200).json({ account_number, account_balance })
  } catch (error) {
    console.log('error', error)
    await transactionModel.del(transactionId);
    throw new createError(401, 'Draw money failed')
  }
});

// Lịch sử nhận tiền: tự nộp tiền + người khác chuyển tiền cho
router.get("/history-deposit/:account", async (req, res) => {
  const account = req.params['account']
  try {
    const result = await transactionModel.getReceiverByAccNumber(account);
    res.status(200).json(result)
  } catch (error) {
    console.log('error', error)
    throw new createError('401', error.message);
  }
});

// Lịch sử chuyển tiền: chuyển cho người khác (không bao gồm để thanh toán nợ)
router.get("/history-transfer/:account", async (req, res) => {
  const account = req.params['account']
  try {
    const result = await transactionModel.getTransferByAccNumber(account);
    const ret = [...result].filter(row => row.pay_debt == -1);
    res.status(200).json(ret)
  } catch (error) {
    console.log('error', error)
    throw new createError('401', error.message);
  }
});

// Lịch sử thanh toán nợ
router.get("/history-paydebt/:account", async (req, res) => {
  const account = req.params['account']
  try {
    const result = await transactionModel.getPayDebt(account);
    res.status(200).json(result)
  } catch (error) {
    console.log('error', error)
    throw new createError('401', error.message);
  }
});

const randomAccountNum = () => {
  var result = "";
  var characters = "0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < account_len; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

module.exports = router;
