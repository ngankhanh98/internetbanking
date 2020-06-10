const db = require("../utils/db");
const bcrypt = require("bcryptjs");
const createError = require("https-error");
const moment = require("moment");

module.exports = {
  all: (_) => db.load(`select * from customer`),
  detail: (username) =>
    db.load(`select * from customer where username = "${username}"`),
  add: async (entity) => {
    // table customer {username, password, fullname};
    // entity {username, password, fullname}

    entity.password = bcrypt.hashSync(entity.password, 8);
    try {
      const rows = await db.load(
        `select * from customer where username = "${entity.username}"`
      );
    } catch (error) {
      return error;
    }

    return db.add(entity, `customer`);
  },
  update: async (entity, username) => {
    // if password
    const { password } = entity;
    if (password) entity.password = bcrypt.hashSync(password, 8);

    try {
      rows = await db.update(entity, { username: username }, `customer`);
    } catch (error) {
      return error;
    }
    return rows;
  },
  login: async (entity) => {
    // entity {username, password}, orgirinal password
    const row = await db.load(
      `select * from customer where username = "${entity.username}"`
    );   
    const { password } = row[0];
    if (bcrypt.compareSync(entity.password, password)) return row[0];
    return false;
  },
  updateToken: async (username, refreshToken) => {
    try {
      await db.del({ username: username }, `customerrefreshtokenext`);
    } catch (error) {
      throw new createError(402, error.message);
    }

    const entity = {
      username: username,
      refreshToken: refreshToken,
      rdt: moment().format("YYYY-MM-DD HH:mm:ss"),
    };
    return await db.add(entity, `customerrefreshtokenext`);
  },
  verifyRefreshToken: async (username, refreshToken) => {
    const sql = `select * from customerrefreshtokenext where username = "${username}" and refreshToken = "${refreshToken}"`;
    const rows = await db.load(sql);
    if (rows.length > 0) return true;

    return false;
  },
  getAccounts: async (username) => {
    try {
      return await db.load(
        `select * from account where customer_username = '${username}'`
      );
    } catch (error) {
      return error;
    }
  },
  getByAccountNumber: async (account_number) => {
    try {
      const rows =  await db.load(
        `select * from customer, account where customer.username = account.customer_username and account.account_number = '${account_number}'`
      );
      return rows[0];
    } catch (error) {
      return error;
    }
  },
  updatePassword: async (newPassword, username) => {  

    try {
      rows = await db.load(`update customer set password ="${newPassword}" where username ="${username}" `);
    } catch (error) {
      return error;
    }
    return rows;
  },
};
