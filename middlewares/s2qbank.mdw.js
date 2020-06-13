const moment = require("moment");
const crypto = require("crypto");
const axios = require("axios");
// const { generateKeyPairSync } = require("crypto");

// const private_key = `-----BEGIN RSA PRIVATE KEY-----\nMIICWwIBAAKBgQCdVTZf1j7wafF7lbvOozMj6uydy7BCY75cSIlGnJbKvRPCEbci\nvxE8PH+pJJ5/k/DGFjY7XSRqzqyCzm0LnvV+57/u/7hXBlpcm+ft2felIIXc/hFS\nID0EACtBnlVtXnJ+38Xlh96sE0ABjGmDXUXKyQ7BEhqumd4iG2Yuhh3s+QIDAQAB\nAoGAB2OnKB0h25y+MLW5mlzj2/3+mvKkFpokqKTnfZ+BHYh/0w+N8F3U62VUAZes\nsgU6u7LzXRpkyXdndsVHLdKLaRWTTHILkmfFHMts10jMX6/2aKvi2x+4lRP1RMBI\nsaTLOqgVFBI8bW+A8dHwce+CorO10x3xq/y0JFjqaE1S+lkCQQDJctCt5ALzKyUH\n75k6v0Eqmr2c0HsSJeSxA8oPq7377WnlV1fRxIExCFNwF1y4S7HH3LI/pX1Mef2k\n/MXsl7IbAkEAx/Ahs3h4ZGY6sZvzrLjuqWSqasYpgzgoab1yxUTjU3n7ldEudFsR\ncGh5eR4YrOnx4rYQgTem3+10DWMnFVeuewJAfZPbTmszA49DuFy+MocDAqIPzW+R\nKNECbO6lyXsQJbnsJ5F5J0TOHFjKWrfVjvVwz9xeKZrqLwBlA7KnV0OBPQJAKCtf\nqf4nOgyr+CkcAPS6xn+6GW+swXdT70Knv2iCv6+/Uy9OxQPS8iGbXjEkxgDOnzzy\n/fMfbNf5PANSw9/05wJAecNvZPfNiCKene4HiWQgziONksof2aB5g2TRSwYpz83R\nUu2hb3bfD9/N7DT3qab+n+s4u7x+4kdz8GrZNuMCZw==\n-----END RSA PRIVATE KEY-----`;
const private_key = `-----BEGIN ENCRYPTED PRIVATE KEY-----
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
-----END ENCRYPTED PRIVATE KEY-----`;

const {
  baseURL,
  security_key,
  passphrase,
} = require("../config/client.s2qbank.json");

module.exports = {
  getAccountInfo: async (account_number) => {
    let timestamp = moment().unix();
    let _data = JSON.stringify(account_number);
    try {
      let response = await axios({
        method: "get",
        url: `public/${account_number}`,
        baseURL: baseURL,
        headers: {
          timestamp,
          security_key,
          hash: crypto
            .createHash("sha256")
            .update(timestamp + _data + security_key)
            .digest("hex"),
        },
      });
      console.log(response.data);
      return response.data;
    } catch (error) {
      console.log(error);
      throw error;
    }
  },
  transferMoney: async (depositor, account_number, amount, note) => {
    let timestamp = moment().unix();
    // let security_key = "test1";
    let data = {
      source_account: depositor,
      destination_account: account_number,
      source_bank: "NKLBank",
      description: note,
      feePayBySender: true,
      fee: 3300,
      amount,
    };
    let _data = JSON.stringify(data);
    try {
      // create signature
      let standardlized_privateKey = privateKey.replace(/\\n/g, "\n");
      let signer = crypto.createSign("sha256");
      signer.update(_data);
      let signature = signer.sign(
        { key: standardlized_privateKey, passphrase: passphrase },
        "hex"
      );

      // send request
      return await axios({
        method: "post",
        url: "public/transfer",
        baseURL: baseURL,
        headers: {
          timestamp,
          security_key,
          hash: crypto
            .createHash("sha256")
            .update(timestamp + _data + security_key)
            .digest("hex"),
        },
        data: {
          data,
          signature,
        },
      });
    } catch (error) {
      throw error;
    }
  },
};
