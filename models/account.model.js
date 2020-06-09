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
    const {transaction_type, target_account, amount_money} = entity;
    if (transaction_type === "-") {
      const rows = await db.load(`select * from account where account_number = "${target_account}"`);
      const balance = parseInt(rows[0].account_balance);
    if (balance < amount_money) return false; // not enough money to be withdrawn
    }

    return await db.load(
      `update account set account_balance = account_balance ${transaction_type} ${amount_money} where account_number = ${target_account}`
    );
  },
  getCustomerInfoByAccNumber: (account_number) => {
    const accnumber = parseInt(account_number);
    return db.load(
      `select fullname, email, account_number from customer, account where customer_username = username and account_number = ${accnumber}`
    );
  },
};
