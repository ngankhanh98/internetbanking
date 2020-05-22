const express = require("express");
const openpgp = require("openpgp");
const interbankTransactionsLogModel = require("../models/partnerbank_transactions_log.model");
const parnerbankModel = require("../models/partnerbank.model");
const accountModel = require("../models/account.model");
const createError = require("https-error");
const CryptoJS = require("crypto-js");
const moment = require("moment");
var isEqual = require("lodash.isequal");

const router = express.Router();

router.post("/add", async (req, res) => {
  // entity {code_bank, name_bank, secret_key}
  const entity = req.body;
  try {
    result = await parnerbankModel.add(req.body);
  } catch (error) {
    throw new createError(401, error.message);
  }
  res.status(201).json(result);
});

router.post("/request", async (req, res) => {
  // req.body = {
  //   data = {
  //     transaction_type: '+/-/?',
  //     source_account: '26348364',
  //     target_account: '87234934',
  //     amount_money: 293234424
  //   }
  //    signature = "-----BEGIN PGP SIGNED MESSAGE ... END PGP SIGNATURE-----" || ""
  // }

  // req.headers = {
  //   partner_code: "vpbank",
  //   timestamp: 873643,
  //   api_signature: hash(data, timestamp, secret_key)
  // }

  console.log(req.body);
  const { data, signed_data } = req.body;
  const { partner_code, timestamp, api_signature } = req.headers;
  const _timestamp = new moment(timestamp);

  // console.log(data, signed_data);
  // console.log(req.headers);
  // What should be done:
  // 1. Check headers['timestamp']. All timestamps of n minutes ago are valid
  // 2. Check headers['api_signature'] if everything is valid: did data, timestamp and secret_key all match;
  //    2.1 If there's a signature, verify it.
  // 3. Process according to req.body.data

  // 1. check timestamp
  var time_delay = 2 * 60; // 2 mins = 120s
  var now = new moment(); // timestamp style
  var duration = moment.duration(now.diff(_timestamp)).asSeconds();
  var isTimestampValid = duration <= time_delay ? true : false;
  if (!isTimestampValid) {
    res.status(401).send("Request expired");
    throw new createError(401, "Request expired");
  }

  // 2. check headers['api_signature']
  var rows = await parnerbankModel.getByCode(partner_code); // get parner's secret_key from our database
  var { secret_key } = rows[0];
  var bytes = CryptoJS.AES.decrypt(api_signature, secret_key);
  var decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

  // check all field match with req.body.data
  // check data, timestamp field
  if (
    !isEqual(JSON.stringify(decryptedData.data.data), JSON.stringify(data.data))
  ) {
    res.status(401).send("Unoriginal package warning");
    throw new createError(401, "Unoriginal package warning");
  }
  // 2.1 If there's signature+data, verify it
  if (signed_data) {
    (async () => {
      var hkp = new openpgp.HKP(); // Defaults to https://keyserver.ubuntu.com, or pass another keyserver URL as a string

      
      
      let _publicKeyArmored = await hkp.lookup({
        query: "it_deparment@partnerbank.com", // "it_deparment@parnerbank.com": email had to be provide by partner bank in person in advanced
      });

      const verified = await openpgp.verify({
        message: await openpgp.cleartext.readArmored(signed_data), // parse armored message
        publicKeys: (await openpgp.key.readArmored(_publicKeyArmored)).keys, // for verification
      });
      const { valid } = verified.signatures[0];
      const keyid = verified.signatures[0].keyid.toHex();
      console.log(keyid);

      if (valid) {
        const keyid = verified.signatures[0].keyid.toHex();
        console.log(keyid);
        // store transaction in NKL bank's database
        // avoiding partner bank being a disclamer in the future
        await interbankTransactionsLogModel.add({
          keyID: keyid,
          package: signed_data,
          timestamp: _timestamp.format("YYYY-MM-DD HH:mm:ss"),
          cryptoType: "PGP",
        });
        // 3. Process according to req.body.data with transaction_type = "+/-"
        const isAccountValid = await accountModel.getByAccNumber(
          data.target_account
        );
        if (isAccountValid.length === 0) {
          res.status(403).send("Cannot find such account");
          throw new createError(403, "Cannot find such account");
        }
        const ret = await accountModel.drawMoney(data);
        if (ret) {
          return res.status(200).json({
            msg: `Transaction succeeded. Online contract stored with keyID = ${verified.signatures[0].keyid.toHex()}`,
            ret: ret,
          });
        } else if (ret === false) {
          res.status(403).send("Not enough money to process transaction");
          throw new createError(403, "Not enough money to process transaction");
        }
      } else {
        res.status(401).send("Signature could not be verified");
        throw new createError(401, "Signature could not be verified");
      }
    })();
  }

  // 3. Process according to req.body.data: query info target account
  console.log(data.transaction_type);
  if (data.transaction_type === "?") {
    const rows = await accountModel.getCustomerInfoByAccNumber(
      data.target_account
    );

    if (rows.length === 0) {
      res.status(401).send("Cannot find information of such account");
      throw new createError(401, "Cannot find information of such account");
    }
    res.status(200).json(rows[0]);
  }
});
module.exports = router;
