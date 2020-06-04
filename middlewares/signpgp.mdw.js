require("express-async-errors");
const openpgp = require("openpgp");

const configPartner = {
    passphrase: "info@nklbank.com",
    name: "MPBank",
};
const passphrase = configPartner.passphrase;

const privateKeyArmored = `-----BEGIN PGP PRIVATE KEY BLOCK-----
Version: Keybase OpenPGP v1.0.0
Comment: https://keybase.io/crypto

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
q2p21Ad9KnbL2mDq/JZXfEP6
=uHfq
-----END PGP PRIVATE KEY BLOCK-----`;
module.exports = {
    sign: async (_data) => {
        const { keys: [privateKey] } = await openpgp.key.readArmored(privateKeyArmored);
        await privateKey.decrypt(passphrase);

        const { data: cleartext } = await openpgp.sign({
            message: openpgp.cleartext.fromText(JSON.stringify(_data)), // CleartextMessage or Message object
            privateKeys: [privateKey]                             // for signing
        });        
        return cleartext;
    }
}
