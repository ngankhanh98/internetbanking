const express = require("express");
const openpgp = require("openpgp");
const interbankTransactionsLogModel = require('../models/interbank_transactions.model');

const router = express.Router();

router.post("/", async (req, res) => {
    /** Parner Bank: app.post('/') de goi API nay, kem goi tin co chu ky nhu nay:
     * req.body = {
     *      cleartext : "-----BEGIN PGP SIGNED MESSAGE----- ... -----END PGP SIGNATURE-----"
     * }
     */
  const {cleartext} = req.body;
  console.log(cleartext);

  (async () => {
    // const passphrase = 'NKL Bank';
    // // generate key pair
    // const {
    //   privateKeyArmored,
    //   publicKeyArmored,
    //   revocationCertificate,
    // } = await openpgp.generateKey({
    //   userIds: [
    //     { name: "NKL Bank", email: "informationtechnology@nklbank.com" },
    //   ],
    //   curve: "ed25519", // ECC curve name
    //   passphrase: passphrase, // protects the private key
    // });

    // // upload public key to HKP server
    // var hkp = new openpgp.HKP();
    // await hkp.upload(publicKeyArmored);

    // // sign with privatekey
    // const { keys: [privateKey] } = await openpgp.key.readArmored(privateKeyArmored);
    // await privateKey.decrypt(passphrase);

    // const { data: cleartext } = await openpgp.sign({
    //     message: openpgp.cleartext.fromText('Hello, there'), // CleartextMessage or Message object
    //     privateKeys: [privateKey]                             // for signing
    // });
    // console.log(cleartext); // '-----BEGIN PGP SIGNED MESSAGE ... END PGP SIGNATURE-----'

    // const text_clone = cleartext;
    // const keyId = (await openpgp.cleartext.readArmored(cleartext))
    //   .getSigningKeyIds()[0]
    //   .toHex();

    var hkp = new openpgp.HKP(); // Defaults to https://keyserver.ubuntu.com, or pass another keyserver URL as a string

    let _publicKeyArmored = await hkp.lookup({
    //   keyID: keyId,
      query: "it_deparment@parnerbank.com", // 
    });

    const verified = await openpgp.verify({
      message: await openpgp.cleartext.readArmored(cleartext), // parse armored message
      publicKeys: (await openpgp.key.readArmored(_publicKeyArmored)).keys, // for verification
    });
    const { valid } = verified.signatures[0];
    if (valid) {
        const keyid = verified.signatures[0].keyid.toHex();
        // lưu lại vào database, sau này mày khỏi chối
      await interbankTransactionsLogModel.add({keyID: keyid, package: cleartext, timestamp: Date.now(), cryptoType: 'PGP' });

      res
        .status(200)
        .json({
            msg: `signed by key id ${verified.signatures[0].keyid.toHex()}`
        });
    } else {
      res
        .status(401)
        .json({
            msg: `signature could not be verified`
        });
    }

    // res.status(200).json({
    //   publicKeyArmored: publicKeyArmored,
    //   privateKeyArmored: privateKeyArmored,
    //   cleartext: cleartext,
    //   keyId: keyId,
    // });
  })();
});

module.exports = router;
