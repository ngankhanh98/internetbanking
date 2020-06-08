const express = require("express");
const axios = require("axios");
const bcrypt = require("bcrypt");
const openpgp = require("openpgp");
const config = require("../config/client.mpbank.json");

const { secret, partnercode, passphrase } = config;

module.exports = {
  getAccountInfo: async (account) => {
    let timeStamp = Date.now();
    let _secret = secret;

    const headers = {
      partnercode: partnercode,
      headersig: bcrypt.hashSync(account + _secret + timeStamp, 10),
      headerts: timeStamp,
    };

    const result = await axios({
      method: "GET",
      url: "https://mpbinternetbanking.herokuapp.com/user/accountNumber",
      data: {
        account: account,
      },
      headers: headers,
    })
      .then((response) => response.data)
      .catch((err) => err);
    return result;
  },
  transferMoney: async (account, money) => {
    await openpgp.initWorker({ path: "openpgp.worker.js" });
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

    await axios({
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
  },
};
