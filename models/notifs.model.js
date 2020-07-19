const db = require('../utils/db');

module.exports = {
    getUnread: async (username) => db.load(`select notifs.*, fullname from notifs, account, customer where account.customer_username = "${username}" and notifs.receiver = account_number and unread = true and account.customer_username = customer.username order by id desc`),
    add: async (newNotif) => db.add(newNotif, `notifs`)
};
