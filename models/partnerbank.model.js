const db = require("../utils/db");
const bcrypt = require("bcryptjs");
const createError = require("https-error");
const moment = require("moment");

module.exports = {
  all: () => db.load(`select * from partnerbank`),

  getByID: async (id_bank) => {
    return await db.load(
      `select * from partnerbank where id_bank = "${id_bank}"`
    );
  },
  getByCode: async (partner_code) => {
    return await db.load(
      `select * from partnerbank where partner_code = "${partner_code}"`
    );
  },
  getByName: async (name_bank) => {
    return await db.load(
      `select * from partnerbank where name_bank = "${name_bank}"`
    );
  },
  add: async (entity) => {
    entity.secret_key = bcrypt.hashSync(entity.secret_key, 8);
    try {
      const rows = await db.load(
        `select * from partnerbank where code_bank = "${entity.code_bank}" and name_bank = "${entity.name_bank}"`
      );
      if (rows.length === 0) return db.add(entity, `partnerbank`);
    } catch (error) {
      return error;
    }
    return;
  },
};
