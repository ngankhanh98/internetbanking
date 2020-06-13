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
const moment = require("moment");
const router = express.Router();

const { tariff } = require("../config/default.json");

router.get("/", async (req, res) => {
  // req.headers {x-access-token}
  const token = req.headers["x-access-token"];
  const decode = jwt.decode(token);
  const { username } = decode;
  const rows = await customerModel.detail(username);
  const result = rows.map((row) =>
    row.password ? { ...row, password: null } : row
  );
  res.status(200).json(result);
});

router.get("/accounts/:type", async (req, res) => {
  const type = req.params["type"];
  // req.headers {x-access-token}
  const token = req.headers["x-access-token"];
  const decode = jwt.decode(token);
  const { username } = decode;
  try {
    const rows = await customerModel.getAccountsByType(username, type);
    res.status(200).json(rows);
  } catch (error) {
    res.status(401).json(error);
  }
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

  const { beneficiary_account, name, bank } = req.body;

  var beneficiary, ref_name;
  try {
    switch (bank) {
      case "mpbank":
        beneficiary = await mpbank.getAccountInfo(beneficiary_account);
        ref_name = beneficiary.result;
        break;
      case "s2qbank":
        beneficiary = await s2qbank.getAccountInfo(beneficiary_account);
        ref_name = beneficiary.full_name;
        break;
      default:
        beneficiary = await customerModel.getByAccountNumber(
          beneficiary_account
        );
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
      beneficiary_account: beneficiary_account,
      beneficiary_name: _name,
      partner_bank: bank,
    });
    res.status(200).json(ret);
  } catch (error) {
    res.status(401).json(error);
  }
});

router.post("/update-beneficiary", async (req, res) => {
  const token = req.headers["x-access-token"];
  const decode = jwt.decode(token);
  const { username } = decode;

  // const { beneficiary_account, new_name } = req.body;
  const { array } = req.body;
  const del_benes = array.filter((els) => els.type == "del");
  const update_benes = array.filter((els) => els.type == "update");
  console.log(del_benes);

  const del_ret = await Promise.all(
    del_benes.map(async (el) => {
      const { beneficiary_account } = el;
      try {
        ret = await beneficiaryModel.del(username, beneficiary_account);
        console.log(`🎉 Succeed delete ${beneficiary_account}`);
      } catch (error) {
        console.log(error);
        res.status(401).json(error);
      }
    })
  );
  const update_ret = await Promise.all(
    update_benes.map(async (el) => {
      const { beneficiary_account, new_name } = el;
      try {
        const ret = await beneficiaryModel.update(
          username,
          beneficiary_account,
          new_name
        );
        console.log(`🎉 Succeed update ${beneficiary_account}`);
      } catch (error) {
        console.log(error);
        res.status(401).json(error);
      }
    })
  );

  res.status(200).json({ msg: "Changes saved" });
});

router.post("/intrabank-transfer-money", async (req, res) => {
  const { depositor, receiver, amount } = req.body;
  const transaction = req.body;
  const timestamp = moment().format("YYYY-MM-DD HH:mm:ss");

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
    const ret = await transactionModel.add({ ...transaction, timestamp });
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
    note,
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
        break;
      default:
        const ret = await s2qbank.transferMoney(
          depositor,
          receiver,
          receiver_get,
          note
        );
        console.log("response from s2qbank");
        console.log(ret);
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

router.get("/beneficiaries", async (req, res) => {
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

router.get("/transactions/transfer", async (req, res) => {
  const account_number = req.body.account_number;
  try {
    const result = await transactionModel.getTransferByAccNumber(
      account_number
    );
    res.status(200).json(result);
  } catch (error) {
    throw new createError(401, error.message);
  }
});
router.get("/transactions/receiver", async (req, res) => {
  const account_number = req.body.account_number;
  try {
    const result = await transactionModel.getReceiverByAccNumber(
      account_number
    );
    res.status(200).json(result);
  } catch (error) {
    throw new createError(401, error.message);
  }
});

router.put("/passwords/ibanking", async (req, res) => {
  const token = req.headers["x-access-token"];
  const decode = jwt.decode(token);
  const username = decode.username;
  var { oldPassword, newPassword } = req.body;
  try {
    const result = await customerModel.updatePassword(
      oldPassword,
      newPassword,
      username
    );
    res.status(200).json(result);
  } catch (error) {
    throw new createError(401, error.message);
  }
});
module.exports = router;
