const express = require("express");
const axios = require("axios");
const bcrypt = require("bcrypt");
const openpgp = require("openpgp");
const createError = require("https-error");
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
    return (result = await axios({
      method: "GET",
      url: "https://mpbinternetbanking.herokuapp.com/user/accountNumber",
      data: {
        account: account,
      },
      headers: headers,
    })
      .then((response) => response.data)
      .catch((err) => {
        throw new createError(
          err.response.status,
          `From mpbank: Account not found`
        );
      }));
  },
  transferMoney: async (
    receiver,
    money,
    depositor,
    note,
    fee,
    charge_include
  ) => {
    await openpgp.initWorker({ path: "openpgp.worker.js" });
    let timeStamp = Date.now();
    let _secret = secret;
    const headers = {
      partnercode: partnercode,
      headersig: bcrypt.hashSync(receiver + _secret + timeStamp, 10),
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
      accountReceiver: receiver,
      money: money,
      signature: detachedSignature,
      content: note,
      typeSend: charge_include,
      fee: fee,
      nameBank: "NKLBank",
      accountSender: depositor,
    };

    return await axios({
      method: "POST",
      url: "https://mpbinternetbanking.herokuapp.com/user/transferLinkBank",
      data: data,
      headers: headers,
    })
      .then((response) => response.data)
      .catch((err) => {
        throw new createError(403, `From mpbank: Account not found`);
      });
  },
};
