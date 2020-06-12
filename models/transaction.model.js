const db = require("../utils/db");

const model = {
  add: async (transaction) => await db.add(transaction, "transaction"),
  del: async (id) => await db.del({ id: id }, "transaction"),
  getTransferByAccNumber: async (acccount_number) => {
    try {
      return await db.load(`select * from transaction where depositor = "${acccount_number}"`)
    } catch (error) {
      return error
    }
  },
  getReceiverByAccNumber: async (acccount_number) => {
    try {
      return await db.load(`select * from transaction where receiver = "${acccount_number}"`)
    } catch (error) {
      return error
    }
  }
};

module.exports = model;