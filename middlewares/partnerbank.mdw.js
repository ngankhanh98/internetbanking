const mpbank = require("./mpbank.mdw");
const s2qbank = require("./s2qbank.mdw");
const createError = require("https-error");
const transactionModel = require("../models/transaction.model");
const accountModel = require("../models/account.model");

module.exports = {
  getAccountInfo: async (partner_bank, account_number) => {
    var result;
    try {
      switch (partner_bank) {
        case "mpbank":
          interbank_query = await mpbank.getAccountInfo(account_number);
          result = {
            fullname: interbank_query.result,
          };
          break;
        case "s2qbank":
          interbank_query = await s2qbank.getAccountInfo(account_number);
          result = {
            fullname: interbank_query.full_name,
          };
          break;
      }
      return result;
    } catch (error) {
      throw new createError(401, error.message);
    }
  },
  transferMoney: async (partner_bank, entity) => {
    const {
      receiver,
      depositor,
      receiver_get,
      note,
      fee,
      charge_include,
    } = entity;
    var result;
    try {
      switch (partner_bank) {
        case "mpbank":
          await mpbank.transferMoney(
            receiver,
            receiver_get,
            depositor,
            note,
            fee,
            charge_include
          );
          break;
        default:
          await s2qbank.transferMoney(depositor, receiver, receiver_get, note);
          break;
      }
    } catch (error) {
      throw new createError(401, error.message);
    }
  },
};
