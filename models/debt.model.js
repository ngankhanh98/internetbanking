const db = require("../utils/db");

const model = {
  add: async (debt) => await db.add(debt, "debt"),
  del: async (id) => await db.del({ id: id }, "debt"),
};

module.exports = model;