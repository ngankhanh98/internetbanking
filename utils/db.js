// const mysql = require("mysql");
// const { promisify } = require("util");
// const { _mysql } = require("../config/default.json");

// const pool = mysql.createPool(_mysql);
// const pool_query = promisify(pool.query).bind(pool);

// module.exports = {
//   load: (sql) => pool_query(sql),
//   add: (entity, table) => pool_query(`insert into ${table} set ?`, entity),
//   del: (condition, table) =>
//     pool_query(`delete from ${table} where ?`, condition),
//   update: (entity, condition, table) =>
//     pool_query(`update ${table} set ? where ?`, [entity, condition]),
// };


const mysql = require('mysql');
// const util = require('util');
const { _mysql } = require("../config/default.json");

// const connection = mysql.createConnection(_mysql);

const createConnection = () => mysql.createConnection(_mysql);

// const query = util.promisify(connection.query).bind(connection);
// const end = util.promisify(connection.end).bind(connection);


// module.exports = {
//   load: async (sql) => {
//     await query(sql)
//     end()
//   },
//   add: async (entity, table) => {
//     await query(`insert into ${table} set ?`, entity)
//     end()
//   },
//   del: async (condition, table) => {
//     await query(`delete from ${table} where ?`, condition)
//     end()

//   },
//   update: async (entity, condition, table) => {
//     await query(`update ${table} set ? where ?`, [entity, condition])
//     end()

//   }
// };


module.exports = {
  load: (sql) => {
    return new Promise((resolve, reject) => {
      const connection = createConnection();
      connection.connect();
      connection.query(sql, (error, results, fields) => {
        if (error) reject(error);
        resolve(results);
      });
      connection.end();
    });
  },
  add: (entity, table) => {
    const sql = `insert into ${table} set ?`
    return new Promise((resolve, reject) => {
      const connection = createConnection();
      connection.connect();
      connection.query(sql, entity, (error, results, fields) => {
        if (error) reject(error);
        resolve(results);
      });
      connection.end();
    });
  },
  del: (condition, table) => {

    const sql = `delete from ${table} where ?`
    return new Promise((resolve, reject) => {
      const connection = createConnection();
      connection.connect();
      connection.query(sql, condition, (error, results, fields) => {
        if (error) reject(error);
        resolve(results.affectedRows);
      });
      connection.end();
    });
  },
  update: async (entity, condition, table) => {
    const sql = `update ${table} set ? where ?`
    return new Promise((resolve, reject) => {
      const connection = createConnection();
      connection.connect();
      connection.query(sql, [entity, condition], (error, results, fields) => {
        if (error) reject(error);
        resolve(results.changedRows);
      });
      connection.end();
    });
  }
};