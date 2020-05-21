const db = require("../utils/db");

module.exports = {
    all:() => db.load(`select * from interbank_transactions_log`),
    add: async (entity) => {
        return await db.add(entity, `interbank_transactions_log`);
    }
}