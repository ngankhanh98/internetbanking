const db = require("../utils/db");

module.exports = {
    all:() => db.load(`select * from partnerbank_transactions_log`),
    add: async (entity) => {
        return await db.add(entity, `partnerbank_transactions_log`);
    }
}