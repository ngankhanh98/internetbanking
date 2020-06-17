const express = require("express");
const accountModel = require("../models/account.model");
const mpbank = require("../middlewares/mpbank.mdw");
const s2qbank = require("../middlewares/s2qbank.mdw");

const router = express.Router();

router.post("/", async (req, res) => {
  const { account_number, bank } = req.body;

  var account_info;
  try {
    switch (bank) {
      case "mpbank":
        account_info = await mpbank.getAccountInfo(account_number);
        break;
      case "s2qbank":
        account_info = await s2qbank.getAccountInfo(account_number);
        break;
      default:
        account_info = await accountModel.getCustomerInfoByAccNumber(
          account_number
        );
        break;
    }
    if (
      account_info == undefined ||
      account_info.name == "Error" ||
      account_info.length === 0
    )
      return res.status(403).json({ msg: "Not found such account" });
  } catch (error) {
    res.status(401).json(error);
  }

  res.status(200).json(...account_info);
  // mpbank: response la { result: "Nguyen Thi Hong Mo"}
  // s2qbank: response la { username: "demo2"}
  // nklbank: response la { fullname, email, account_number, type }
});

module.exports = router;
