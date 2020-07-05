const express = require("express");
const createError = require("https-error");
const personnelModel = require("../models/personnel.model");
const jwt = require("jsonwebtoken");
const router = express.Router();
const transactionModel = require("../models/transaction.model");
const moment = require("moment");
const { sendPassword } = require("../middlewares/verify.mdw");
const crypto = require("crypto");

router.get("/", async (req, res) => {
  const token = req.headers["x-access-token"];
  const { username } = jwt.decode(token);
  console.log(username);
  try {
    const person = await personnelModel.getSingleByUsername(username);
    res.status(200).json(person);
  } catch (err) {
    console.log("GET detail err ", err);
  }
});
router.get("/personnel", async (req, res) => {
  const token = req.headers["x-access-token"];
  const { username } = jwt.decode(token);
  console.log(username);
  try {
    await personnelModel.checkPermission("admin", username);
    const listPersons = await personnelModel.getAll(); //personnel
    res.status(200).json(listPersons);
  } catch (err) {
    console.log("personnel error", err);
    throw err;
  }
});

router.post("/personnel", async (req, res) => {
  const token = req.headers["x-access-token"];
  const { username } = jwt.decode(token);
  try {
    await personnelModel.checkPermission("admin", username);
    let person = req.body;
    const password = crypto.randomBytes(4).toString("hex");

    const existUsr = await personnelModel.getSingleByUsername(person.username);
    if (existUsr) throw new createError(400, "user name is exist");
    person.fullname = person.fullname
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase();
    person["password"] = password;
    const result = await personnelModel.add(person);
    await sendPassword(person.username, password, person.email);
  } catch (err) {
    throw err;
  }
  res.sendStatus(200);
});

router.put("/personnel/:id", async (req, res) => {
  const token = req.headers["x-access-token"];
  const { username } = jwt.decode(token);
  try {
    await personnelModel.checkPermission("admin", username);
    let newPerson = req.body;
    newPerson.fullname = newPerson.fullname
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase();
    if (newPerson.password) {
      delete newPerson.password;
    }
    const succeeded = await personnelModel.updateById(newPerson, req.params.id);
    if (succeeded) {
      res.sendStatus(200);
    }
  } catch (err) {
    console.log(err);
    throw err;
  }
});

router.delete("/personnel/:id", async (req, res) => {
  const token = req.headers["x-access-token"];
  const { username } = jwt.decode(token);
  try {
    await personnelModel.checkPermission("admin", username);
    const succeeded = await personnelModel.delById(req.params.id);
    if (succeeded) {
      res.sendStatus(200);
    }
  } catch (err) {
    throw err;
  }
});

router.get("/transactions/filter", async (req, res) => {
  const token = req.headers["x-access-token"];
  const { username } = jwt.decode(token);
  const { from, to, bankCode } = req.query;

  try {
    await personnelModel.checkPermission("admin", username);

    if (!bankCode) {
      const transactions = await transactionModel.getFilteredByTime(from, to);
      return res.status(200).json(transactions);
    }
    const transactions = await transactionModel.getFilteredByBankCode(
      bankCode,
      from,
      to
    );
    //const transactions = await transactionModel.getAllByBankCode(bankCode);
    return res.status(200).json(transactions);
  } catch (err) {
    throw err;
  }
});

router.get("/transactions", async (req, res) => {
  const token = req.headers["x-access-token"];
  const { username } = jwt.decode(token);
  const { from, to } = req.query;
  const dateFrom = new Date(from);
  const dateTo = new Date(to);

  console.log(req.query);
  try {
    await personnelModel.checkPermission("admin", username);
    const transactions = await transactionModel.getFilteredByTime(from, to);
    res.status(200).json(transactions);
  } catch (err) {
    throw err;
  }
});

module.exports = router;
