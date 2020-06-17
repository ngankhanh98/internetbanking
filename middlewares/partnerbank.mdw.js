const mpbank = require("./mpbank.mdw");
const s2qbank = require("./s2qbank.mdw");
const createError = require("https-error");

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
          console.log(interbank_query);
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
};
