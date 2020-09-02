const express = require("express");
const openpgp = require("openpgp");
const interbankTransactionsLogModel = require("../models/partnerbank_transactions_log.model");
const parnerbankModel = require("../models/partnerbank.model");
const accountModel = require("../models/account.model");
const createError = require("https-error");
const CryptoJS = require("crypto-js");
const moment = require("moment");
var isEqual = require("lodash.isequal");
const signpgp = require("../middlewares/signpgp.mdw");
const transactionModel = require("../models/transaction.model");

const router = express.Router();

router.get("/", async (req, res) => {
  const ret = await parnerbankModel.all();
  console.log("ret", ret);
  // const entries = Object.fromEntries(ret);
  res.status(200).json(ret);
});

router.post("/request", async (req, res) => {
  // req.body = {
  //   data = {
  //     transaction_type: '+/?',
  //     source_account: '26348364',
  //     target_account: '87234934',
  //     amount_money: 293234424,
  //     note: "pay debt, thanks",
  //     charge_include: true, // if true, target_account+=amount_money; else, target_account+=(amount_money - your bank's fee)
  //   }
  //    signed_data = "-----BEGIN PGP SIGNED MESSAGE ... END PGP SIGNATURE-----" || ""
  // }

  // req.headers = {
  //   partner_code: "vpbank",
  //   timestamp: 873643,
  //   api_signature: hash(data, timestamp, secret_key)
  // }

  // res.status(201);

  const { data, signed_data } = req.body;
  const {
    target_account,
    source_account,
    amount_money,
    note,
    charge_include,
  } = data;
  const { partner_code, timestamp, api_signature } = req.headers;
  const partner_bank =
    partner_code === "MtcwLbASeIXVnKurQCHrDCmsTEsBD7rQ44wHsEWjWtl8k"
      ? "MPB"
      : partner_code === "ccQ8SCo7jaJIsphleBkn"
      ? "S2Q Bank"
      : "CryptoBank";
  const _timestamp = new moment(timestamp);

  console.log("💡 req.body :>> ", req.body);
  console.log("💡 req.headers :>> ", req.headers);
  console.log("💡 partner_bank :>> ", partner_bank);

  // What should be done:
  // 1. Check headers['timestamp']. All timestamps of n minutes ago are valid
  // 2. Check headers['api_signature'] if everything is valid: did data, timestamp and secret_key all match to those in database of in req.body.data;
  //    2.1 If there's a signature, verify it.
  // 3. Process transaction according to req.body.data

  // 1. check timestamp
  const time_delay = 2 * 60; // 2 mins = 120s delay is fine
  var now = new moment();
  var duration = moment.duration(now.diff(_timestamp)).asSeconds();
  if (duration > time_delay) {
    return res.status(401).json({ msg: "Request expired" });
    // throw new createError(401, "❌ Request expired");
  }

  // 2. check headers['api_signature']
  var rows = await parnerbankModel.getByCode(partner_code); // get parner's secret_key, email from our database
  var { secret_key, email, publicKey } = rows[0];
  console.log("💡 publicKey :>>", JSON.stringify(publicKey));
  var bytes = CryptoJS.AES.decrypt(api_signature, secret_key);
  var decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

  // check fields in decryptedData.data match with req.body.data
  if (
    !isEqual(JSON.stringify(decryptedData.data.data), JSON.stringify(data.data))
  ) {
    console.log("❌ Unoriginal package warning");
    return res.status(401).json({ msg: "Unoriginal package warning" });
    // throw new createError(401, "❌ Unoriginal package warning");
  }

  // 2.1 If there's signature+data, verify it
  if (signed_data) {
    (async () => {
      const verified = await openpgp.verify({
        message: await openpgp.cleartext.readArmored(signed_data), // parse armored message
        publicKeys: (await openpgp.key.readArmored(publicKey)).keys, // for verification
      });
      const { valid } = verified.signatures[0];
      // const keyid = verified.signatures[0].keyid.toHex();

      if (valid) {
        const keyid = verified.signatures[0].keyid.toHex();
        console.log("💡 keyid :>> ", keyid);

        // 3. Process transaction according to req.body.data with transaction_type = "+/-", relate to $
        try {
          const isAccountValid = await accountModel.getByAccNumber(
            data.target_account
          );
          if (isAccountValid.length === 0) {
            console.log("❌ Cannot find such account");
            return res.status(403).json({ msg: "Cannot find such account" });
            // throw new createError(403, "❌ Cannot find such account");
          }
        } catch (error) {
          console.log(`❌ ${error}`);
          return res.status(error.status).json(error);
          //throw new createError(error.status, `❌ ${error.message}`);
        }

        // store transaction in table `partnerbank_transactions_log`
        // avoiding partner bank being a disclamer in the future
        try {
          await interbankTransactionsLogModel.add({
            keyID: keyid,
            package: signed_data,
            timestamp: _timestamp.format("YYYY-MM-DD HH:mm:ss"),
          });
          console.log(`🎉 Write 'partnerbank_transactions_log' succeed`);
        } catch (error) {
          console.log(`❌ ${error}`);
          return res.status(error.status).json(error);
          // throw new createError(error.status, `❌ ${error.message}`);
        }

        // store transaction in table `transaction`
        try {
          await transactionModel.add({
            depositor: source_account,
            receiver: target_account,
            partner_bank,
            amount: amount_money,
            note,
            charge_include,
            timestamp: _timestamp.format("YYYY-MM-DD HH:mm:ss"),
            keyID: keyid,
          });
          console.log(`🎉 Write 'transaction' succeed`);
        } catch (error) {
          console.log(`❌ ${error}`);

          return res.status(error.status).json(error);
          // throw new createError(error.status, `❌ ${error.message}`);
        }

        // draw money
        try {
          const ret = await accountModel.drawMoney(data);
          const info = {
            msg: `Transaction succeeded. Online contract stored with keyID = ${keyid}`,
            ret: ret,
          };
          const sign = await signpgp.sign(info);
          console.log("🎯 response :>> ", { info, sign });
          res.status(200).json({ info, sign });
        } catch (error) {
          console.log(`❌ ${error}`);
          // throw new createError(error.status, `❌ ${error.message}`);
          return res.status(error.status).json(error);
        }
      } else {
        console.log("❌ Signature could not be verified");
        return res.status(401).json({ msg: "Signature could not be verified" });
        // throw new createError(401, "❌ Signature could not be verified");
      }
    })();
  }

  // 3. Process according to req.body.data: query info target account
  if (data.transaction_type === "?") {
    const rows = await accountModel.getCustomerInfoByAccNumber(
      data.target_account
    );

    if (rows.length === 0) {
      console.log("❌ Cannot find such account");
      return res.status(401).json({ msg: "Cannot find such account" });
      // throw new createError(403, "❌ Cannot find such account");
    }
    res.status(200).json(rows[0]);
    console.log("🎯 response :>> ", rows[0]);
  }
});
module.exports = router;
