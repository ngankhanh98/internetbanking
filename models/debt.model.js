const db = require("../utils/db");

const model = {
  add: async (debt) => await db.add(debt, "debt"),
  del: async (id) => await db.del({ id: id }, "debt"),
  allByCrediter: async (creditor) => {
    try {
      const row = await db.load(
        `select * from debt where creditor = "${creditor}"`
      );
      return row;
    } catch (err) {
      throw err;
    }
  },
  allByPayer: async (payer) => {
    try {
      const row = await db.load(`select * from debt where payer = "${payer}"`);
      return row;
    } catch (err) {
      throw err;
    }
  },
  // update: async (id) => await db.update({ paid: true }, { id }, "debt"),
  update: async (debt) => {
    const { id } = debt;
    return await db.update(debt, { id }, "debt")
  },
  get: async (id) => await db.load(`select * from debt where id=${id}`)
};

module.exports = model;
