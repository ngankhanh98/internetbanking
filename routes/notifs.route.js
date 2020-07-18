const express = require("express");
const router = express.Router();

const moment = require('moment');
const jwt = require("jsonwebtoken");

const notifsModel = require('../models/notifs.model');


router.get('/:username', async (req, res) => {
    const { username } = req.params
    console.log('username', username)
    try {
        const result = await notifsModel.getUnread(username)
        console.log('result', result)
        res.status(200).json(result)
    } catch (error) {
        throw error
    }
})

router.post('/', async (req, res) => {
    const now = moment().format("YYYY-MM-DD HH:mm:ss");
    const newNotif = { ...req.body, timestamp: now };

    try {
        const result = await notifsModel.add(newNotif)
        console.log('result', result)
        res.status(200).json(result)
    } catch (error) {
        throw error
    }
})

module.exports = router
