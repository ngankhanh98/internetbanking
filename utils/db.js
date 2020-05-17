const mysql = require("mysql");
const { promisify } = require("util");

const pool = mysql.createPool({
  connectionLimit: 100,
  host: "ebanking.cj3ogc5subyk.ap-southeast-1.rds.amazonaws.com",
  port: 3306,
  user: "admin",
  password: "20031998",
  database: "ebanking",
});

const pool_query = promisify(pool.query).bind(pool);

module.exports = {
  load: (sql) => { console.log(sql);pool_query(sql);},
  add: (entity, table) => pool_query(`insert into ${table} set ?`, entity),
  del: (condition, table) => pool_query(`delete from ${table} where ?`, condition),
  update: (entity, condition, table) => pool_query(`update ${table} set ? where ?`, [entity, condition]),
};
