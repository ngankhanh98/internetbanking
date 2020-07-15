const db = require('../utils/db');

module.exports = {
    getUnread: async (receiver) => db.load(`select * from notifs where receiver = "${receiver}" and unread = true`),
    add: async (newNotif) => db.add(newNotif, `notifs`)
};
