const express = require("express");
const axios = require("axios");
const bcrypt = require("bcrypt");
const openpgp = require('openpgp');
const config = require('../config/cli.mpbank');

const router = express.Router();

const pri = config.privateKey;
const {secret, partnercode, passphrase} = config;

router.get("/:account", (req, res) => {
  let account = req.params.account;
  console.log(account);
  let timeStamp = Date.now();
  let _secret = secret;

  const headers = {
    partnercode: partnercode,
    headersig: bcrypt.hashSync(account + _secret + timeStamp, 10),
    headerts: timeStamp,
  };

  axios({
    method: "GET",
    url: "https://mpbinternetbanking.herokuapp.com/user/accountNumber",
    data: {
      account: account,
    },
    headers: headers,
  })
    .then((res) => {
      console.log(res.data);
    })
    .catch((err) => {
      console.log(err.response);
    });
});

router.post("/transaction", async (req, res) => {
  await openpgp.initWorker({ path: "openpgp.worker.js" });
  let { account, money } = req.body;
  let timeStamp = Date.now();
  let _secret = secret;
  const headers = {
    partnercode: partnercode,
    headersig: bcrypt.hashSync(account + _secret + timeStamp, 10),
    headerts: timeStamp,
  };

  // private key
  const {
    keys: [privateKey],
  } = await openpgp.key.readArmored(config.privateKey);
  await privateKey.decrypt(passphrase);
  const { signature: detachedSignature } = await openpgp.sign({
    message: openpgp.cleartext.fromText("Nap tien"),
    privateKeys: [privateKey],
    detached: true,
  });

  console.log(detachedSignature);
  let data = {
    accountReceiver: account,
    money: money,
    signature: detachedSignature,
  };

  axios({
    method: "POST",
    url: "https://mpbinternetbanking.herokuapp.com/user/transfer",
    data: data,
    headers: headers,
  })
    .then((response) => {
      console.log(response);
      res.status(response.status).json(response.data);
    })
    .catch((err) => {
      res.status(err.res.status).send(err);
      console.log(err);
    });
});

module.exports = router;
