const express = require("express");
const customerModel = require("../models/customer.model");
const createError = require("https-error");
const jwt = require("jsonwebtoken");
const ranToken = require("rand-token");
const { auth } = require("../config/default.json");
const verify = require("../middlewares/verify.mdw");
const personnelModel = require("../models/personnel.model");
const router = express.Router();
const bcrypt = require("bcryptjs");

// customer login
router.post("/", async (req, res) => {
  // req.body{username, password}

  const entity = req.body;
  // check wheter username existed
  const isUsernameValid = await customerModel.detail(entity.username);
  if (isUsernameValid.length === 0)
    return res.status(403).send("Username not found");

  // check password
  var result;
  try {
    result = await customerModel.login(entity);
    if (!result) return res.status(403).send("Wrong password.");
  } catch (error) {
    throw new createError(401, error.message);
  }

  // if login succeed
  const token = generateToken(result.username);

  const { RFSZ } = auth;
  const refreshToken = ranToken.generate(RFSZ);
  await customerModel.updateToken(result.username, refreshToken);

  res.status(200).json({
    accessToken: token,
    refreshToken,
  });
});

// personnel login
router.post("/personnel", async (req, res) => {
  // req.body{username, password}
  try {
    const entity = req.body;
    // check  username existed
    console.log(entity);
    const user = await personnelModel.getSingleByUsername(entity.username);
    console.log(user);
    if (!user) throw new createError(404, "Username not found");

    const succeeded = bcrypt.compareSync(entity.password, user.password);
    if (!succeeded) throw new createError(403, "Password is wrong");
  } catch (error) {
    throw error;
  }
  // if login succeeded
  const token = generateToken(req.body.username);
  const { RFSZ } = auth;
  const refreshToken = ranToken.generate(RFSZ);

  await personnelModel.updateToken(req.body.username, refreshToken);

  res.status(200).json({
    accessToken: token,
    refreshToken,
  });

  // const { RFSZ } = auth;
  // const refreshToken = ranToken.generate(RFSZ);
  // await customerModel.updateToken(result.username, refreshToken);

  // res.status(200).json({
  //   accessToken: token,
  //   refreshToken,
  // });
});
router.post("/refresh", async (req, res) => {
  // req.body {accessToken: refreshToken}

  const decode = jwt.decode(req.body.accessToken);
  const { username } = decode;
  try {
    var ret = await customerModel.verifyRefreshToken(
      username,
      req.body.refreshToken
    );
    if (ret === false)
      ret = await personnelModel.verifyRefreshToken(
        username,
        req.body.refreshToken
      );
    if (ret === false) throw new createError(402, "Invalid access token");
  } catch (error) {
    throw new createError(401, error.message);
  }

  const accessToken = generateToken(username);
  res.json({ accessToken });
});

const generateToken = (username) => {
  const { key, expiresIn } = auth;
  const payLoad = { username: username };
  const token = jwt.sign(payLoad, key, {
    expiresIn: expiresIn,
  });
  return token;
};

router.get("/otp", async (req, res) => {
  const token = req.headers["x-access-token"];

  const decode = jwt.decode(token);
  const username = decode ? decode.username : null;
  if (!username) return res.status(403).json({ msg: "Not found account" });
  const row = await customerModel.detail(username);
  const email = row[0].email;
  try {
    const otp = await verify.generateOTP(username, email); // time remaining is 180
    res.status(200).json({ msg: "Create otp successful" });
  } catch (err) {
    res.status(401).json({ msg: err.message });
  }
});

router.post("/otp", (req, res) => {
  const token = req.headers["x-access-token"];
  const decode = jwt.decode(token);
  const username = decode.username;
  const otp = req.body.otp;
  console.log(username, otp);
  try {
    verify.verifyOTP(otp, username);
    res.status(200).json({ msg: "OTP is valid" });
  } catch (err) {
    res.status(401).json({ msg: err.message });
  }
});
module.exports = router;
