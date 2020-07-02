const express = require("express");
const customerModel = require("../models/customer.model");
const accountModel = require("../models/account.model");
const beneficiaryModel = require("../models/beneficiaries.model");
const transactionModel = require("../models/transaction.model");
const debtModel = require("../models/debt.model");
const createError = require("https-error");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mpbank = require("../middlewares/mpbank.mdw");
const s2qbank = require("../middlewares/s2qbank.mdw");
const partnerbank = require("../middlewares/partnerbank.mdw");
const moment = require("moment");
const router = express.Router();

const { bank } = require("../config/default.json");
const { min_transfermoney } = bank;

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

router.post("/update-beneficiary", async (req, res) => {
  const token = req.headers["x-access-token"];
  const decode = jwt.decode(token);
  const { username } = decode;

  // const { beneficiary_account, new_name } = req.body;
  const array = req.body;
  console.log(array);
  const del_benes = array.filter((els) => els.type == "del");
  const update_benes = array.filter((els) => els.type == "update");
  console.log(del_benes);
  console.log(update_benes);

  const del_ret = await Promise.all(
    del_benes.map(async (el) => {
      const { beneficiary_account } = el;
      try {
        ret = await beneficiaryModel.del(username, beneficiary_account);
        console.log(`🎉 Succeed delete ${beneficiary_account}`);
      } catch (error) {
        console.log(error);
        return res.status(401).json(error);
      }
    })
  );
  const update_ret = await Promise.all(
    update_benes.map(async (el) => {
      const { beneficiary_account, beneficiary_name } = el;
      try {
        const ret = await beneficiaryModel.update(
          username,
          beneficiary_account,
          beneficiary_name
        );
        console.log(`🎉 Succeed update ${beneficiary_account}`);
      } catch (error) {
        console.log(error);
        return res.status(401).json(error);
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
    return res.status(403).json({ msg: "Account balance not enough" });
  }
  if (receivers.length === 0) {
    return res.status(403).json({ msg: "Receiver account not found" });
  }

  // store transaction
  var transaction_id;
  try {
    const ret = await transactionModel.add({ ...transaction, timestamp });
    transaction_id = ret.insertId;
    console.log(ret);
  } catch (error) {
    return res.status(403).json({ msg: error });
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
    return res.status(403).json({ msg: error });
  }

  try {
    await accountModel.drawMoney(_receiver);
  } catch (error) {
    await transactionModel.del(transaction_id); // delete transaction record
    const revert_depositor = { ..._depositor, transaction_type: "+" }; // revert depositor balance
    await accountModel.drawMoney(revert_depositor);
    return res.status(403).json({ msg: error });
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
  const fee = bank.transfer_fee;
  const depositor_pay = charge_include ? amount + fee : amount;
  const receiver_get = charge_include ? amount : amount - fee;
  const transaction = { ...req.body, amount: depositor_pay };

  // check if amount > min_transfermoney
  if (amount < min_transfermoney)
    return res
      .status(403)
      .json({ msg: `Transfer money less than minimun ${min_transfermoney}` });
  // check if depositor's balance > money to transfer
  const depositors = await accountModel.getByAccNumber(depositor);
  const { account_balance } = depositors[0];
  if (account_balance < amount) {
    return res.status(403).json({ msg: "Account balance not enough" });
  }

  // check if receiver valid (in case of add new, not from the list)
  var account_info;
  try {
    account_info = await partnerbank.getAccountInfo(partner_bank, receiver);
  } catch (error) {
    return res.status(403).json({ msg: error.message });
  }
  // store transaction
  var transaction_id;
  try {
    const ret = await transactionModel.add(transaction);
    transaction_id = ret.insertId;
    console.log(ret);
  } catch (error) {
    return res.status(403).json({ msg: "Store transaction fail" });
  }

  // procceed draw money
  const _depositor = {
    transaction_type: "-",
    target_account: depositor,
    amount_money: depositor_pay,
  };

  try {
    await accountModel.drawMoney(_depositor);
  } catch (error) {
    await transactionModel.del(transaction_id);
    return res.status(403).json({ msg: "Draw money fail" });
  }

  // try {
  //   switch (partner_bank) {
  //     case "mpbank":
  //       await mpbank.transferMoney(
  //         receiver,
  //         receiver_get,
  //         depositor,
  //         note,
  //         fee,
  //         charge_include
  //       );
  //       break;
  //     default:
  //       const ret = await s2qbank.transferMoney(
  //         depositor,
  //         receiver,
  //         receiver_get,
  //         note
  //       );
  //       console.log(ret);
  //       break;
  //   }
  // } catch (error) {
  //   await transactionModel.del(transaction_id);
  //   const revert_depositor = { ..._depositor, transaction_type: "+" };
  //   await accountModel.drawMoney(revert_depositor);
  //   return res.status(403).json({ msg: "Transfer money fail" });
  // }

  const entity = {
    receiver,
    depositor,
    receiver_get,
    note,
    fee,
    charge_include,
  };
  try {
    await partnerbank.transferMoney(partner_bank, entity);
  } catch (error) {
    const revert_depositor = { ..._depositor, transaction_type: "+" };
    await accountModel.drawMoney(revert_depositor);
    return res.status(403).json({ msg: "Transfer money fail" });
  }

  const response = {
    transaction_id,
    depositor,
    receiver,
    amount,
    net_receiving: receiver_get,
    note,
    partner_bank,
    charge_include,
    fee,
  };
  res.status(200).json(response);
});

// permission: personels, customers
router.post("/update", async (req, res) => {
  const token = req.headers["x-access-token"];
  const decode = jwt.decode(token);

  const username = decode.username;
  try {
    const result = await customerModel.update(req.body, username);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(403).json({ msg: error });
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

router.get("/beneficiaries-v2", async (req, res) => {
  const token = req.headers["x-access-token"];
  const decode = jwt.decode(token);

  const username = decode.username;
  var rows;
  try {
    rows = await beneficiaryModel.getAllByUsername(username);
  } catch (error) {
    throw new createError(401, error.message);
  }
  let key = 1;

  // const nklbank = rows
  //   .filter((row) => row.partner_bank == null);
  //   const ret = nklbank.map((el) => new_el =)
  console.log(nklbank);
  res.status(200).json(nklbank);

  // const result = rows.map(
  //   (elem, key) => (new_elem = { ...elem, key: key + 1 })
  // );
  // res.status(200).json(result);
});

router.get("/transactions/transfer", async (req, res) => {
  const account_number = req.query.account_number;
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
  const account_number = req.query.account_number;
  try {
    const result = await transactionModel.getReceiverByAccNumber(
      account_number
    );
    res.status(200).json(result);
  } catch (error) {
    throw new createError(401, error.message);
  }
});
router.get("/transactions/normal", async (req, res) => {
  const account_number = req.query.account_number;
  try {
    const transfers = await transactionModel.getTransferByAccNumber(
      account_number
    );
    const receivers = await transactionModel.getReceiverByAccNumber(
      account_number
    );
    const debts = await transactionModel.getDebtByAccNumber(account_number);

    const result = { transfers, receivers, debts };
    res.status(200).json(result);
  } catch (err) {
    throw err;
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

router.get("/debts", async (req, res) => {
  const token = req.headers["x-access-token"];
  const decode = jwt.decode(token);
  const username = decode.username;
  var debts = [];
  try {
    const accounts = await customerModel.getAccounts(username);
    console.log("account", accounts);
    var accInfo = { creditors: [], payers: [] };

    await Promise.all(
      accounts.map(async (acc) => {
        const creditors = await debtModel.allByCrediter(acc.account_number);
        const payers = await debtModel.allByPayer(acc.account_number);

        // var accInfo = { creditors: [], payers: [] };

        creditors.map((creditor) => {
          accInfo.creditors.push(creditor);
        });
        payers.map((payer) => {
          accInfo.payers.push(payer);
        });

        // if (creditors.length > 0 || payers.length > 0) {
        //   debts.push(accInfo);
        // }
      })
    );
    // res.status(200).json(debts);
    res.status(200).json(accInfo);
  } catch (error) {
    throw new createError(400, error.message);
  }
});

router.post("/debts", async (req, res) => {
  const token = req.headers["x-access-token"];
  const decode = jwt.decode(token);
  const { username } = decode;
  const timestamp = moment().format("YYYY-MM-DD HH:mm:ss");

  const debt = { ...req.body, timestamp };
  try {
    const result = await debtModel.add(debt);
    res.status(200).json(result);
  } catch (error) {
    throw new createError(400, error.message);
  }
});

router.delete("/debts", async (req, res) => {
  const id = req.body.id;

  try {
    const result = await debtModel.del(id);
    console.log(result);
    res.status(204).json();
  } catch (err) {
    throw new createError(400, error.message);
  }
});

router.post("/update-debts", async (req, res) => {
  const { id } = req.body;
  const token = req.headers["x-access-token"];
  const decode = jwt.decode(token);
  const { username } = decode;

  try {
    const result = await debtModel.update(id);
    res.status(200).json(result);
  } catch (error) {
    throw new createError(400, error.message);
  }
});
module.exports = router;
