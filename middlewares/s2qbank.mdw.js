const moment = require("moment");
const crypto = require("crypto");
const axios = require("axios");
const { generateKeyPairSync } = require("crypto");

const private_key = `-----BEGIN RSA PRIVATE KEY-----\nMIICWwIBAAKBgQCdVTZf1j7wafF7lbvOozMj6uydy7BCY75cSIlGnJbKvRPCEbci\nvxE8PH+pJJ5/k/DGFjY7XSRqzqyCzm0LnvV+57/u/7hXBlpcm+ft2felIIXc/hFS\nID0EACtBnlVtXnJ+38Xlh96sE0ABjGmDXUXKyQ7BEhqumd4iG2Yuhh3s+QIDAQAB\nAoGAB2OnKB0h25y+MLW5mlzj2/3+mvKkFpokqKTnfZ+BHYh/0w+N8F3U62VUAZes\nsgU6u7LzXRpkyXdndsVHLdKLaRWTTHILkmfFHMts10jMX6/2aKvi2x+4lRP1RMBI\nsaTLOqgVFBI8bW+A8dHwce+CorO10x3xq/y0JFjqaE1S+lkCQQDJctCt5ALzKyUH\n75k6v0Eqmr2c0HsSJeSxA8oPq7377WnlV1fRxIExCFNwF1y4S7HH3LI/pX1Mef2k\n/MXsl7IbAkEAx/Ahs3h4ZGY6sZvzrLjuqWSqasYpgzgoab1yxUTjU3n7ldEudFsR\ncGh5eR4YrOnx4rYQgTem3+10DWMnFVeuewJAfZPbTmszA49DuFy+MocDAqIPzW+R\nKNECbO6lyXsQJbnsJ5F5J0TOHFjKWrfVjvVwz9xeKZrqLwBlA7KnV0OBPQJAKCtf\nqf4nOgyr+CkcAPS6xn+6GW+swXdT70Knv2iCv6+/Uy9OxQPS8iGbXjEkxgDOnzzy\n/fMfbNf5PANSw9/05wJAecNvZPfNiCKene4HiWQgziONksof2aB5g2TRSwYpz83R\nUu2hb3bfD9/N7DT3qab+n+s4u7x+4kdz8GrZNuMCZw==\n-----END RSA PRIVATE KEY-----`;

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
        method: 'get',
        url: `public/${account_number}`,
        baseURL: baseURL,
        headers: {
          timestamp,
          security_key,
          hash: crypto.createHash('sha256').update(timestamp + _data + security_key).digest('hex')
        }
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
      source_bank: 'NKLBank',
      description: note,
      feePayBySender: true,
      fee: 3300,
      amount
    };
    let _data = JSON.stringify(data);
    try {
      // create signature
      let privateKey = private_key.replace(/\\n/g, '\n');
      let signer = crypto.createSign('sha256');
      signer.update(_data);
      let signature = signer.sign(privateKey, 'hex');

      // send request
      let result = await axios({
        method: 'post',
        url: 'public/transfer',
        baseURL: baseURL,
        headers: {
          timestamp,
          security_key,
          hash: crypto.createHash('sha256').update(timestamp + _data + security_key).digest('hex')
        },
        data: {
          data,
          signature,
        }
      });
      console.log(result.data);
    } catch (error) {
      console.log(error.response.status);
      console.log(error.response.message);
    }
  }
};
