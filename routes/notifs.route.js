const express = require("express");
const router = express.Router();

const moment = require('moment');

const notifsModel = require('../models/notifs.model');


router.get('/:receiver', async (req, res) => {
    const { receiver } = req.params;
    try {
        const result = await notifsModel.getUnread(receiver)
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
