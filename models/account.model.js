const db = require("../utils/db");
const dbName = "ebanking";
module.exports = {
  all: () => db.load(`select * from account`),

  getByUsrName: (username) => {
    return db.load(`select * from account where username = "${username}"`);
  },
  getByAccNumber: (account_number) => {
    const accnumber = parseInt(account_number);
    return db.load(`select * from account where account_number = ${accnumber}`);
  },
  drawMoney: async (entity) => {
    const { amount_money, target_account, transaction_type } = entity;
    const _transaction_type = transaction_type || "+";
    return await db.load(
      `update account set account_balance = account_balance ${_transaction_type} ${amount_money} where account_number = ${target_account}`
    );
  },
  getCustomerInfoByAccNumber: (account_number) => {
    const accnumber = parseInt(account_number);
    return db.load(
      `select fullname, email, account_number, type from customer, account where customer_username = username and account_number = ${accnumber}`
    );
  },
};
