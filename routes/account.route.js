const express = require("express");
const accountModel = require("../models/account.model");
const mpbank = require("../middlewares/mpbank.mdw");
const s2qbank = require("../middlewares/s2qbank.mdw");
const partnerbank = require("../middlewares/partnerbank.mdw");
const customerModel = require("../models/customer.model");
const router = express.Router();

router.post("/", async (req, res) => {
  const { account_number } = req.body;
  const account = req.body;
  var account_info;
  if (account.bank) {
    const { bank } = account;
    console.log("bank", bank);
    try {
      account_info = await partnerbank.getAccountInfo(bank, account_number);
    } catch (error) {
      return res.status(403).json({ msg: error.message });
    }
  } else {
    try {
      account_info = await customerModel.getByAccountNumber(account_number);
      console.log(account_info);
      if (!account_info)
        return res.status(403).json({ msg: "From nklbank: Account not found" });
    } catch (error) {
      console.log(error);
      return res.status(403).json(error);
    }
  }

  const { fullname } = account_info;
  const result = {
    beneficiary_account: account_number,
    beneficiary_name: fullname,
    bank: account.bank,
  };

  res.status(200).json(result);
  // mpbank: response la { result: "Nguyen Thi Hong Mo"}
  // s2qbank: response la { username: "demo2"}
  // nklbank: response la { fullname, email, account_number, type }
});

router.get("/:account");

module.exports = router;
