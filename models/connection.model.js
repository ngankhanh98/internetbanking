const users = []
module.exports = {
    addConnection: (id, username) => {
        console.log('username', username)
        // const existingConnection = users.find((user) => user.username === username);

        if (!username) return { error: 'Username are required.' };
        // if (existingConnection) return { error: 'Connection is taken.' };

        const user = { id, username };

        users.push(user);
        console.log('users :>> ', users);
        return { user };
    },

    removeConnection: (id) => {
        const index = users.findIndex((user) => user.id === id);
        if (index !== -1) return users.splice(index, 1)[0];
        console.log('users :>>', users)
    },
    getConnection: (id) => users.find((user) => user.id === id),
    // getConnectionByUsername: (username) => users.find((user) => user.username === username),
    getConnectionByUsername: (username) => users.filter((user) => user.username === username),
    getConnectionsInRoom: (room) => users.filter((user) => user.room === room),
};
