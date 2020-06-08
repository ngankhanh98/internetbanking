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
    if (entity.transaction_type === "-") {
      const rows = await db.load(`select * from account where account_number = "${entity.target_account}"`);
      console.log(rows[0]);
      const balance = parseInt(rows[0].account_balance);
    if (balance < entity.amount_money) return false; // not enough money to be withdrawn
    }

    return await db.load(
      `update account set account_balance = account_balance ${entity.transaction_type} ${entity.amount_money} where account_number = ${entity.target_account}`
    );
  },
  getCustomerInfoByAccNumber: (account_number) => {
    const accnumber = parseInt(account_number);
    return db.load(
      `select fullname, email, account_number, type from customer, account where customer_username = username and account_number = ${accnumber}`
    );
  },
};
