const db = require("../utils/db");

const model = {
  add: async (transaction) => await db.add(transaction, "transaction"),
  del: async (id) => await db.del({ id: id }, "transaction"),
  getTransferByAccNumber: async (acccount_number) => {
    try {
      return await db.load(`select * from transaction where depositor = "${acccount_number}" order by timestamp desc`)
    } catch (error) {
      throw error
    }
  },
  getReceiverByAccNumber: async (acccount_number) => {
    try {
      return await db.load(`select * from transaction where receiver = "${acccount_number}" order by timestamp desc`)
    } catch (error) {
      throw error
    }
  },
  getByAccNumber: async(acccount_number)=>{
    try {
      
    } catch (error) {
      
    }
  }
};

module.exports = model;