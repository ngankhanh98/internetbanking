const db = require("../utils/db");

module.exports = {
  add: async (transaction) => await db.add(transaction, "transaction"),
  del: async (id) => await db.del({ id: id }, "transaction"),
};
