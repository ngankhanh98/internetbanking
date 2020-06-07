const express = require("express");
const customerModel = require("../models/customer.model");
const createError = require("https-error");
const jwt = require("jsonwebtoken");
const ranToken = require("rand-token");
const { auth } = require("../config/default.json");

const router = express.Router();

// customer login
router.post("/", async (req, res) => {
  // req.body{username, password}

  const entity = req.body;
  // check wheter username existed
  const isUsernameValid = await customerModel.detail(entity.username);
  if (isUsernameValid.length === 0) res.status(403).send("Wrong username.");

  // check password
  var result;
  try {
    result = await customerModel.login(entity);
    if (!result) res.status(403).send("Wrong password.");
  } catch (error) {
    throw new createError(401, error.message);
  }

  // if login suceeded
  const token = generateToken(result.username);

  const { RFSZ } = auth;
  const refreshToken = ranToken.generate(RFSZ);
  await customerModel.updateToken(result.username, refreshToken);

  res.status(200).json({
    accessToken: token,
    refreshToken,
  });
});

router.post("/refresh", async (req, res) => {
  // req.body {accessToken: refreshToken}

  const decode = jwt.decode(req.body.accessToken);
  const { username } = decode;
  try {
    const ret = await customerModel.verifyRefreshToken(
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
  const {key, expiresIn} = auth;
  const payLoad = { username: username };
  const token = jwt.sign(payLoad, key, {
    expiresIn: expiresIn,
  });
  return token;
};
module.exports = router;
