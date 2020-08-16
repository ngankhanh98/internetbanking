const mysql = require('mysql');
const util = require('util');
const { _mysql } = require("../config/default.json");

const createConnection = () => mysql.createConnection(_mysql);

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
