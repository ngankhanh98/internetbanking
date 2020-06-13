const express = require("express");
const customerModel = require("../models/customer.model");
const accountModel = require("../models/account.model");
const createError = require("https-error");

const router = express.Router();

const { bank } = require("../config/default.json");
const { account_len } = bank;

router.post("/add-customer", async (req, res) => {
  var { fullname, username } = req.body;
  var result; 

  fullname = fullname
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
  const standarlize = (req_body) => ({
    ...req_body,
    fullname: fullname, // Lê Long Đỉnh --> LE LONG DINH
  });
  const entity = standarlize(req.body);

  // add customer to table `customer`
  try {
    const ret = await customerModel.add(entity);
    const confirmed_info = await customerModel.detail(username);
    const info = { ...confirmed_info[0], password: null };
    result = { db: { ...ret }, customer: { ...info } };
  } catch (error) {
    throw new createError(401, error.message);
  }

  // genenerate and add a new random account respectively
  const account = {
    account_number: randomAccountNum(),
    type: 0,  // tai khoan thanh toan default
    customer_username: username
  }
  try {
    const ret = await accountModel.add(account);
    result = {}
  } catch (error) {
    throw new createError(401, error.message);
  }

});

router.post("/add-account", async (req, res) => {
  // const { account, type, customer_username } = req.body;
  const entity = { ...req.body };
  try {
    const ret = await accountModel.add(entity);
    res.status(200).json(ret);
  } catch (error) {
    throw new createError(401, error.message);
  }
});

const randomAccountNum = () => {
  var result = "";
  var characters = "0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < account_len; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

module.exports = router;

