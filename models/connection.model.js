const users = []
module.exports = {
    addConnection: ({ id, name, room }) => {
        name = name.trim().toLowerCase();
        room = room.trim().toLowerCase();

        const existingConnection = users.find((user) => user.room === room && user.name === name);

        if (!name || !room) return { error: 'Connection and room are required.' };
        if (existingConnection) return { error: 'Connection is taken.' };

        const user = { id, name, room };

        users.push(user);
        console.log('users :>> ', users);
        return { user };
    },

    removeConnection: (id) => {
        const index = users.findIndex((user) => user.id === id);

        if (index !== -1) return users.splice(index, 1)[0];
    },
    getConnection: (id) => users.find((user) => user.id === id),
    getConnectionsInRoom: (room) => users.filter((user) => user.room === room)
};
