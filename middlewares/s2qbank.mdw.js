const moment = require("moment");
const crypto = require("crypto");
const axios = require("axios");
const { generateKeyPairSync } = require("crypto");

const private_key = `-----BEGIN RSA PRIVATE KEY-----
MIICXAIBAAKBgQCU5GERIeoG00vWFCGMk5x/jPGlorXafeYQkr5Z7aumIUTHyu8D
35+K7EQu74j5In/vlUiqOzsjGgVJ0hUXWGCj+9YhOOT7bhulBhz/54Y3Uu3oug6r
hG02vSiYusriq6UccU3oa0LsTWR6ztge7f3r4mvKCHTSW5iVx7EhJ5XkcwIDAQAB
AoGAdRAmfTjj7l/cxUFoq0U3i1V+fJM0VcgcxbUKclwaU/DeShN03t/IaYqfhSOR
1wdX/T+rNSSCt3Ny6vqA2K0EtVWOOyw/KZ9xJXfWhWavGUJeUZhvSsFyVVQsRXin
c7MR2MRbJvMKST3urHroKsBHJkGYcWz18hmaT4Z8wD6lHAECQQDTKthfBGNbOJfi
ewVQDjrtox/aSIf46gRpGiY0JcXniIXGHW+xr2SuN3W94z0In6/PItJQReuquKdS
paZvmU5zAkEAtIDP68lIl+dN+ur2KLGVVifpncGU/eGwcLw6sB2Q+KX950LWdxrK
HG0kqBVIPXdIMv0yTF6zV1RfRc9k+wWSAQJAGLATp9gtfYa6SyIy1s8zGIFPwgdk
zjcd2OPTv5kC8DTH3wel/VISJUQaod6lThLNTRw3Fmd2S/lWppTzRmzX/QJBAJt9
Rx7/MoigWV1n4AroBxPDqAwcgQM+0mYaz5d8sLBxFUqNGgBZ1HcuUeB1DNjeExTR
Ze3Buk3lQXj6kitm/gECQFU3vEpabta+Q02pUmnV8QjFdzj9nIlfZAVGgy8HLsv2
ukRJKUe5V/UZgY53c7Mk/o0CAPltvHLC2E4p1soQUjo=
-----END RSA PRIVATE KEY-----`;

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

    const { publicKey, privateKey } = generateKeyPairSync("rsa", {
      modulusLength: 1024,
      publicKeyEncoding: {
        type: "spki",
        format: "pem",
      },
      privateKeyEncoding: {
        type: "pkcs8",
        format: "pem",
        cipher: "aes-256-cbc",
        passphrase,
      },
    });

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

    // create signature
    try {
      let privateKey = private_key.replace(/\\n/g, "\n");
      let signer = crypto.createSign("sha256");
      signer.update(_data);
      let signature = signer.sign(privateKey, "hex");

      const headers = {
        timestamp,
        security_key,
        hash: crypto
          .createHash("sha256")
          .update(timestamp + _data + security_key)
          .digest("hex"),
      };
      await axios
        .post(
          `${baseURL}/public/transfer`,
          { data, signature },
          { headers: headers }
        )
        .then((result) => {
          console.log(result.data);
          return result.data;
        })
        .catch((err) => {
          console.log(err.response);
          throw err;
        });
    } catch (error) {
      console.log(error);
      throw error;
    }
  },
};
