const io = require('socket.io')();
let socketAPI = {};

const connectionModel = require('../models/connection.model');

io.on('connection', (socket) => {

    console.log('New connection')

    // socket.on('join', ({ owner, receiver, message }) => {
    //     console.log('owner >>', owner)
    //     console.log('receiver', receiver)
    //     console.log('message', message)

    //     const { user, error } = connectionModel.addConnection(socket.id, owner, receiver)

    //     if (error) return callback(error);
    //     socket.join(user.room); // room = receiver
    //     socket.broadcast.to(user.room).emit('message', ({ message }));

    // })

    socket.on('join', ({ username }, callback) => {
        console.log('username ', username)
        const { user, error } = connectionModel.addConnection(socket.id, username);
        if (error) return callback(error)
    })

    socket.on('sendNotif', ({ receiver, message }) => {
        console.log('receiver', receiver)
        console.log('message', message)

        const user = connectionModel.getConnectionByUsername(receiver);
        console.log('user', user)
        const { id } = user
        socket.to(id).emit('getNotif', { message })
    })





    socket.on('disconnect', () => {
        console.log('Kill connection')
    })
})

socketAPI.io = io;
module.exports = socketAPI;
