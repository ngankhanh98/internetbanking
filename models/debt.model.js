const db = require("../utils/db");

const model = {
    add: async (debt) => await db.add(debt, "debt"),
    del: async (id) => await db.del({ id: id }, "debt"),
    allByCrediter: async (creditor) => {
        try {
            const row = await db.load(`select * from debt where creditor = "${creditor}"`)
            return row;
        }
        catch (err) {
            throw err;
        }
    },
    allByPayer: async (payer) => {
        try {
            const row = await db.load(`select * from debt where payer = "${payer}"`)
            return row;
        }
        catch (err) {
            throw err;
        }
    }
};

module.exports = model;