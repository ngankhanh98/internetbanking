const mysql = require("mysql");
const { promisify } = require("util");
const config = require('../config/default.json')

const pool = mysql.createPool(config.mysql);
const pool_query = promisify(pool.query).bind(pool);

module.exports = {
  load:  (sql) =>  pool_query(sql),
  add: (entity, table) => pool_query(`insert into ${table} set ?`, entity),
  del: (condition, table) => pool_query(`delete from ${table} where ?`, condition),
  update: (entity, condition, table) => pool_query(`update ${table} set ? where ?`, [entity, condition]),
};
