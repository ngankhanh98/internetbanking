const express = require("express");
const customerModel = require("../models/customer.model");
const createError = require("https-error");
const jwt = require("jsonwebtoken");
const ranToken = require("rand-token");
const { auth } = require("../config/default.json");
const verify = require('../middlewares/verify.mdw');
const { route } = require("./customer.route");

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

router.get('/otp', (req,res) => {
  const token = req.headers["x-access-token"];
  
  const email = req.params.email;
  const decode = jwt.decode(token);
  const username = decode.username;
  try{

    const otp =  verify.generateOTP(username,email); // time remaining is 180
    res.status(200).json({msg: "Create otp successful"});
  } catch (err){
    res.status(404).json({msg: err.message})
  }
})

router.post('/otp', (req,res)=>{
  const token = req.headers["x-access-token"];
  const decode = jwt.decode(token);
  const username = decode.username;
  const otp = req.body.otp
  console.log(username, otp);
  try {

    verify.verifyOTP(otp, username);
    res.status(200).json({msg: "OTP is valid" })
  }
  catch (err){

    res.status(401).json({msg: err.message})
  }

})
module.exports = router;
