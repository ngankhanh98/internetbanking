const express = require("express");
const moment = require("moment");
const crypto = require("crypto");
const axios = require("axios");
const { generateKeyPairSync } = require("crypto");

const {
  privateKey,
  security_key,
  passphrase,
} = require("../config/client.s2qbank.json");

module.exports = {
  getAccountInfo: async (account) => {
    let data = { account_number: account };
    let timestamp = moment().unix();
    let _data = JSON.stringify(data, null, 2);
    return await axios({
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
      .then((response) => response.data)
      .catch((err) => err);
  },
  transferMoney: async (account_number, money) => {
    let data = { account_number, money };

    let timestamp = moment().unix();
    let _data = JSON.stringify(data, null, 2);

    const signer = crypto.createSign("RSA-SHA256");
    signer.update(_data);
    const signature = signer.sign({ key: privateKey, passphrase }, "hex");

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
  },
};
