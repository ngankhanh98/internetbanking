require("express-async-errors");
const openpgp = require("openpgp");
const { signature } = require("../config/default.json");

const { privateKeyArmored, passphrase } = signature;
module.exports = {
  sign: async (_data) => {
    const {
      keys: [privateKey],
    } = await openpgp.key.readArmored(privateKeyArmored);
    await privateKey.decrypt(passphrase);

    const { data: cleartext } = await openpgp.sign({
      message: openpgp.cleartext.fromText(JSON.stringify(_data)), // CleartextMessage or Message object
      privateKeys: [privateKey], // for signing
    });
    return cleartext;
  },
};
