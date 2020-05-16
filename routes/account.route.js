const express = require("express");
const customerModel = require("../models/customer.model");
const createError = require("https-error");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const ranToken = require("rand-token");

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



module.exports = router;
