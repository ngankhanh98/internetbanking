const express = require("express");
const createError = require("https-error");
const personnelModel = require("../models/personnel.model");
const jwt = require("jsonwebtoken");
const router = express.Router();

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
    person.fullname = person.fullname
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase();
    const result = await personnelModel.add(person);
  } catch (err) {
    throw err;
  }
  res.sendStatus(200);
});

module.exports = router;
