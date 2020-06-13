const db = require("../utils/db");
const createError = require("https-error");

const model = {
  add: async (entity) => {
    try {
      return await db.add(entity, "beneficiaries");
    } catch (error) {
      throw error;
    }
  },
  getAllByUsername: async (username) => {
    try {
      return await db.load(
        `select * from beneficiaries where customer_username = "${username}"`
      );
    } catch (error) {
      throw error;
    }
  },
  update: async (username, bene_account, bene_name) => {
    try {
      const ret = await db.load(
        `update beneficiaries set beneficiary_name = '${bene_name}' where customer_username = '${username}' and beneficiary_account = '${bene_account}'`
      );
      return ret;
    } catch (error) {
      throw error;
    }
  },
  del: async (username, bene_account) => {
    try {
      return await db.load(
        `delete from beneficiaries where customer_username = '${username}' and beneficiary_account = '${bene_account}'`
      );
    } catch (error) {
      throw error;
    }
  },
};
module.exports = model;
