const express = require("express");
const moment = require("moment");
const crypto = require("crypto");
const axios = require("axios");
const { generateKeyPairSync } = require("crypto");

const router = express.Router();

const {
  privateKey,
  security_key,
  passphrase,
} = require("../config/client.s2qbank");

// const { publicKey, privateKey } = generateKeyPairSync('rsa', {
//   modulusLength: 4096,
//   publicKeyEncoding: {
//     type: 'spki',
//     format: 'pem'
//   },
//   privateKeyEncoding: {
//     type: 'pkcs8',
//     format: 'pem',
//     cipher: 'aes-256-cbc',
//     passphrase: config.passphrase
//   }
// });

router.get("/:account", (req, res) => {
  let data = { account_number: req.params.account };
  let timestamp = moment().unix();
  let _data = JSON.stringify(data, null, 2);
  return axios({
    method: "get",
    url: "/api/v1/linked/account",
    baseURL: "https://s2q-ibanking.herokuapp.com",
    headers: { timestamp, security_key },
    data: {
      data,
      hash: crypto
        .createHash("sha256")
        .update(timestamp + _data + security_key)
        .digest("hex"),
    },
  })
    .then(function (response) {
      res.send(response.data);
    })
    .catch((err) => res.send(err));
});

router.post("/transaction", async (req, res) => {
  let data = {
    account_number: req.body.data.account_number,
    amount: req.body.data.amount,
  };

  let timestamp = moment().unix();
  let _data = JSON.stringify(data, null, 2);

  const signer = crypto.createSign("RSA-SHA256");
  signer.update(_data);
  const signature = signer.sign(
    { key: privateKey, passphrase},
    "hex"
  );

  await axios({
    method: "post",
    url: "/api/v1/linked/account",
    baseURL: "https://s2q-ibanking.herokuapp.com",
    headers: { timestamp, security_key },
    data: {
      data,
      hash: crypto
        .createHash("sha256")
        .update(timestamp + _data + security_key)
        .digest("hex"),
      signature: signature,
    },
  })
    .then((response) => {
      console.log(response.data);
      res.status(response.status).json(response.data);
    })
    .catch((err) => {
      res.status(err.response.status).send(err.response.data);
    });
});

module.exports = router;
