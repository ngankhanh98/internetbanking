const db = require("../utils/db");
const createError = require("https-error");
const model = {
  add: async (transaction) => await db.add(transaction, "transaction"),
  del: async (id) => await db.del({ id: id }, "transaction"),
  getTransferByAccNumber: async (acccount_number) => {
    try {
      return await db.load(
        `select * from transaction where depositor = "${acccount_number}" and depositor!=receiver order by timestamp desc`
      );
    } catch (error) {
      throw error;
    }
  },
  getReceiverByAccNumber: async (account_number) => {
    try {
      return await db.load(
        `select * from transaction where receiver = "${account_number}" order by timestamp desc`
      );
    } catch (error) {
      throw error;
    }
  },
  getDebtByAccNumber: async (account_number) => {
    try {
      return await db.load(
        `select * from transaction where pay_debt <0 and( receiver = "${account_number}" or depositor= "${account_number}") order by timestamp desc`
      );
    } catch (error) {
      throw error;
    }
  },
  getByAccNumber: async (acccount_number) => {
    try {
    } catch (error) { }
  },
  getAllByBankCode: async (bank) => {
    try {
      const transactions = await db.load(
        `select * from transaction where partner_bank = "${bank}"`
      );

      return transactions;
    } catch (error) {
      throw new createError(500, "Failed to load transactions");
    }
  },
  getFilteredByTime: async (from, to) => {
    try {
      console.log(
        `select * from transaction where timestamp > ${from} and timestamp < ${to} and partner_bank != null`
      );

      const transactions = await db.load(
        `select * from transaction where timestamp > "${from}" and timestamp < "${to}"and partner_bank != ""`
      );
      return transactions;
    } catch (error) {
      console.log(error);
      throw new createError(500, "Failed to get filtered transactions");
    }
  },
  getPayDebt: async (depositor) => {
    try {
      return await db.load(`select * from transaction where depositor = "${depositor}" and pay_debt!=-1`)

    } catch (error) {
      console.log('error', error)
      throw new createError("401", error.message);
    }
  }
};

module.exports = model;
