const express = require("express");
const accountModel = require("../models/account.model");
const mpbank = require("../middlewares/mpbank.mdw");
const s2qbank = require("../middlewares/s2qbank.mdw");

const router = express.Router();

router.post("/", async (req, res) => {
  const { account_number, bank } = req.body;

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
  const result = {
    beneficiary_account: account_number,
    beneficiary_name: fullname,
  };

  res.status(200).json(result);
  // mpbank: response la { result: "Nguyen Thi Hong Mo"}
  // s2qbank: response la { username: "demo2"}
  // nklbank: response la { fullname, email, account_number, type }
});

module.exports = router;
