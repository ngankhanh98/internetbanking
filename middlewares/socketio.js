const io = require('socket.io')();
let socketAPI = {};

const connectionModel = require('../models/connection.model');

io.on('connection', (socket) => {

    console.log('New connection')

    socket.on('join', ({ username }) => {
        console.log('username >>', username)

    })

    socket.on('disconnect', () => {
        console.log('Kill connection')
    })
})

socketAPI.io = io;
module.exports = socketAPI;