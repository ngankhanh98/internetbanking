const express = require("express");
const customerModel = require("../models/customer.model");
const createError = require("https-error");
const bcrypt = require("bcryptjs");
const openpgp = require('openpgp');
const acountModel = require("../models/account.model")
const router = express.Router();
// customer login
const header = "MP bank";
const time = Date.now();
const parma = { countNumber: "1123" }

let sign;

const secretKey = "abc";
const hashString = secretKey + time + JSON.stringify(parma);

router.get("/", (req, res) => {
    bcrypt.genSalt(10, function (err, salt) {
        bcrypt.hash(hashString, salt, function (err, hash) {
            if (err) {
                console.log(err)
                res.json(err);
            }
            console.log(hash)
            sign = hash;
            res.json(hash);
        });
    });
})


router.get("/compare", (req, res) => {
    const timeLog = time + 60000;

    if (header != "MP bank") {
        res.status(500).json({ err: "Bank code does not exist" });
    }
    if (timeLog.valueOf() < Date.now().valueOf()) {
        res.status(500).json({ err: "time out" })
    }
    else {
        bcrypt.compare(hashString, sign).then(function (result) {
            console.log(result)
            res.json(result);
        });
    }
})

const publicKeyArmored = `-----BEGIN PGP PUBLIC KEY BLOCK-----
Version: Keybase OpenPGP v1.0.0
Comment: https://keybase.io/crypto

xo0EXr+euAEEAMk5eH1oovCpq/TDitIxoTym/M8ZUSdF2hCeqSoTleJiNTw0lN+c
vs+UbfHOnjFMQ/zwPLzcRuiE553e81DDGjqz4rXNupb7FqYcZtk3q8bv9SyY2Pos
YgDlUQoVw9ha+mQluz+2d/YwI8NpJiPAFg2OREbqSHvxYTzVvldBTGhrABEBAAHN
J0hvw6BuZyBOaGkgKGthYSkgPGRzcy5pbnRlcm5AdnRpanMuY29tPsKtBBMBCgAX
BQJev564AhsvAwsJBwMVCggCHgECF4AACgkQIaTrB0GRa5iIZQP+I4YWD7+VA0Lu
6+ifL09fss9mqWY/7DH+4xFuIqJOKCIz6JcJSajc56HH5HW2TSgu2FTZ07SOH38R
K+3z9UV9j2atq6Vr1YPTtlMPR5vT0tjI9SqunS66saO025kP1ilw986V3XpA9wUL
RlCiMdCyMHQqqHN3/I9V3P3bWCQHxdbOjQRev564AQQAuJkBfjyAV8yWUQB4zRVu
v3KHbfWt5X6TcrkroX/U7rnd/OjVTau/8nrxwrov95eGSOLXtuWdUHcz+FbYEDMs
Cf/DB0Gkzvo0z73eC8olMwCcvDPjZHQnSNTg6KkeNfioulmvBur/Oq5Com9y/jND
AAsWq/o8hGEk890Llzib9JkAEQEAAcLAgwQYAQoADwUCXr+euAUJDwmcAAIbLgCo
CRAhpOsHQZFrmJ0gBBkBCgAGBQJev564AAoJEJNvh3v/PA1XXzID/2KGF84p4L92
DiT2PU8v5eyzdZ6Xeo3Qthw4ku+jzAvrbx3sTdbNiBDj3so0gpKjseDCn4XJl949
FjZ+/u7g2JaRaZwaU7Xw5k7AtMRjx8gkedLEOhjvguOKmxJubb7GwFwjoKsNPRXi
jvfrCfi9KCXD8By4jkFkM7C7quW5Tupg0P8EALatgOZR1ksHfz53Rgnhwur1/A//
JkAfYgsiul/vuXs49LjCSoCpT88DH5e5bhRWnNCtZIQmHpiAimGEYR/RvpoTvt8/
f5qgdFDJl9HI1PI65B4ypvAnaHuK4EHwTlAvfjUPmPWkwU/8C47aa0cjFt4HSRHM
yuhyx4iZ1xgVsPRnzo0EXr+euAEEAJi9le44WnNY5afX3va4j8IgFu5TWD16moSY
SdzdIy1QKj57oIyYQW68/mH7/1Rj4YjHTpncsmM71rZPFQziF+sgBmYsFvYx2C25
uIVjrAlAmqkAu2S30pr1QsS5fVy1GEjTlzFxHHh4FqYAyuMzV4/tCLc6A7z1yxPE
K3JhFFhZABEBAAHCwIMEGAEKAA8FAl6/nrgFCQ8JnAACGy4AqAkQIaTrB0GRa5id
IAQZAQoABgUCXr+euAAKCRARwl/v085TECgtA/9lpw0LEsrC9hZIcreVeHF9uOl4
lOLfB7Ws3OLvFdH+rha0yizA7k8gPqCfMN5HBNGA7ThN/Y/NN75ExicKEYlKx5oS
jbl5MrlNNVTFZ3EcpI6w/axoV+fnEVN8kYy6BXKs2CeqTvXnuOoXB/GMNnZtKau4
Z+gmJ1rb4/R0OmeGB6AGA/9+G69fjOiq0N61tZ+IfjE5QmWxB/SmT+iYeU0hghEy
WKCcp4Jo4Q/XnrjoDfA5200U7VdfA+Z5EpACn/FjV/jUchXoJCvwD0QD/RAOyX4F
uugnQjPQHrbwHaGFOXLLDLwGNPfvKLQLT6DHrQ42IDDEoPvBN7LZpLCJp5r4tyhC
OA==
=1YWl
-----END PGP PUBLIC KEY BLOCK-----`;
const privateKeyArmored = `-----BEGIN PGP PRIVATE KEY BLOCK-----
Version: Keybase OpenPGP v1.0.0
Comment: https://keybase.io/crypto

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
=x9me
-----END PGP PRIVATE KEY BLOCK-----`; // encrypted private key
const passphrase = `hoainhi`;
openpgp.initWorker({ path: 'openpgp.worker.js' });
router.post("/transfer", (req, res) => {
    (async () => {
        await openpgp.initWorker({ path: 'openpgp.worker.js' }); // set the relative web worker path

        const publicKeyArmored = `-----BEGIN PGP PUBLIC KEY BLOCK-----
        Version: Keybase OpenPGP v1.0.0
        Comment: https://keybase.io/crypto
        
        xo0EXr+euAEEAMk5eH1oovCpq/TDitIxoTym/M8ZUSdF2hCeqSoTleJiNTw0lN+c
        vs+UbfHOnjFMQ/zwPLzcRuiE553e81DDGjqz4rXNupb7FqYcZtk3q8bv9SyY2Pos
        YgDlUQoVw9ha+mQluz+2d/YwI8NpJiPAFg2OREbqSHvxYTzVvldBTGhrABEBAAHN
        J0hvw6BuZyBOaGkgKGthYSkgPGRzcy5pbnRlcm5AdnRpanMuY29tPsKtBBMBCgAX
        BQJev564AhsvAwsJBwMVCggCHgECF4AACgkQIaTrB0GRa5iIZQP+I4YWD7+VA0Lu
        6+ifL09fss9mqWY/7DH+4xFuIqJOKCIz6JcJSajc56HH5HW2TSgu2FTZ07SOH38R
        K+3z9UV9j2atq6Vr1YPTtlMPR5vT0tjI9SqunS66saO025kP1ilw986V3XpA9wUL
        RlCiMdCyMHQqqHN3/I9V3P3bWCQHxdbOjQRev564AQQAuJkBfjyAV8yWUQB4zRVu
        v3KHbfWt5X6TcrkroX/U7rnd/OjVTau/8nrxwrov95eGSOLXtuWdUHcz+FbYEDMs
        Cf/DB0Gkzvo0z73eC8olMwCcvDPjZHQnSNTg6KkeNfioulmvBur/Oq5Com9y/jND
        AAsWq/o8hGEk890Llzib9JkAEQEAAcLAgwQYAQoADwUCXr+euAUJDwmcAAIbLgCo
        CRAhpOsHQZFrmJ0gBBkBCgAGBQJev564AAoJEJNvh3v/PA1XXzID/2KGF84p4L92
        DiT2PU8v5eyzdZ6Xeo3Qthw4ku+jzAvrbx3sTdbNiBDj3so0gpKjseDCn4XJl949
        FjZ+/u7g2JaRaZwaU7Xw5k7AtMRjx8gkedLEOhjvguOKmxJubb7GwFwjoKsNPRXi
        jvfrCfi9KCXD8By4jkFkM7C7quW5Tupg0P8EALatgOZR1ksHfz53Rgnhwur1/A//
        JkAfYgsiul/vuXs49LjCSoCpT88DH5e5bhRWnNCtZIQmHpiAimGEYR/RvpoTvt8/
        f5qgdFDJl9HI1PI65B4ypvAnaHuK4EHwTlAvfjUPmPWkwU/8C47aa0cjFt4HSRHM
        yuhyx4iZ1xgVsPRnzo0EXr+euAEEAJi9le44WnNY5afX3va4j8IgFu5TWD16moSY
        SdzdIy1QKj57oIyYQW68/mH7/1Rj4YjHTpncsmM71rZPFQziF+sgBmYsFvYx2C25
        uIVjrAlAmqkAu2S30pr1QsS5fVy1GEjTlzFxHHh4FqYAyuMzV4/tCLc6A7z1yxPE
        K3JhFFhZABEBAAHCwIMEGAEKAA8FAl6/nrgFCQ8JnAACGy4AqAkQIaTrB0GRa5id
        IAQZAQoABgUCXr+euAAKCRARwl/v085TECgtA/9lpw0LEsrC9hZIcreVeHF9uOl4
        lOLfB7Ws3OLvFdH+rha0yizA7k8gPqCfMN5HBNGA7ThN/Y/NN75ExicKEYlKx5oS
        jbl5MrlNNVTFZ3EcpI6w/axoV+fnEVN8kYy6BXKs2CeqTvXnuOoXB/GMNnZtKau4
        Z+gmJ1rb4/R0OmeGB6AGA/9+G69fjOiq0N61tZ+IfjE5QmWxB/SmT+iYeU0hghEy
        WKCcp4Jo4Q/XnrjoDfA5200U7VdfA+Z5EpACn/FjV/jUchXoJCvwD0QD/RAOyX4F
        uugnQjPQHrbwHaGFOXLLDLwGNPfvKLQLT6DHrQ42IDDEoPvBN7LZpLCJp5r4tyhC
        OA==
        =1YWl
        -----END PGP PUBLIC KEY BLOCK-----`;
        const privateKeyArmored = `-----BEGIN PGP PRIVATE KEY BLOCK-----
        Version: Keybase OpenPGP v1.0.0
        Comment: https://keybase.io/crypto
        
        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
        =x9me
        -----END PGP PRIVATE KEY BLOCK-----`; // encrypted private key
        const passphrase = `hoainhi`; // what the private key is encrypted with

        const { keys: [privateKey] } = await openpgp.key.readArmored(privateKeyArmored);
        await privateKey.decrypt(passphrase);

        const { data: encrypted } = await openpgp.encrypt({
            message: openpgp.message.fromText('Hello, World!'),                 // input as Message object
            publicKeys: (await openpgp.key.readArmored(publicKeyArmored)).keys, // for encryption
            privateKeys: [privateKey]                                           // for signing (optional)
        });
        console.log(encrypted); // '-----BEGIN PGP MESSAGE ... END PGP MESSAGE-----'
        const { data: decrypted } = await openpgp.decrypt({
            message: await openpgp.message.readArmored(encrypted),              // parse armored message
            publicKeys: (await openpgp.key.readArmored(publicKeyArmored)).keys, // for verification (optional)
            privateKeys: [privateKey]                                           // for decryption
        });
        console.log(decrypted); // 'Hello, World!'
        res.status(500).json(encrypted);
    })().catch(err => console.log(err));
})

let enc;
router.post('/encrypt-message', (req, res) => {
    // TODO: get public key from mongo based on the lookup and put here
    const encryptDecryptFunction = async () => {
        const options = {
            message: openpgp.message.fromText("helloo world"),       // input as Message object
            publicKeys: (await openpgp.key.readArmored(publicKeyArmored)).keys // for encryption
        }
        const { data: encrypted } = await openpgp.encrypt(options)
        console.log(encrypted);
        enc = encrypted;
        return encrypted
    }

    const prom = encryptDecryptFunction();
    prom.then(function (result) {
        res.status(500).json(result)
    }).catch(err => err);
});

router.post('/decrypt-message', (req, res) => {
    // TODO: get public key from mongo based on the lookup and put here
    const encryptDecryptFunction = async () => {
        const privKeyObj = (await openpgp.key.readArmored(privateKeyArmored)).keys[0]
        await privKeyObj.decrypt(passphrase)
        const encrypted = enc;

        const options1 = {
            message: await openpgp.message.readArmored(encrypted),    // parse armored message
            privateKeys: [privKeyObj]                                 // for decryption
        }

        const plaintext = await openpgp.decrypt(options1);
        return plaintext.data
    }

    const prom = encryptDecryptFunction();
    prom.then(function (result) {
        res.status(500).json(result)
    }).catch(function (err) {
        res.status(500).json(err)
    })
        .catch(err => console.log(err));
},
);
router.post("/testdb", async (req, res) => {
    
    try {
        const data = await acountModel.all();
        console.log(data);
        res.json(data);
    } catch (error) {
        return error;
    }

});



module.exports = router;
