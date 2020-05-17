const db = require("../utils/db");
const bcrypt = require("bcryptjs");
const createError = require("https-error");
const moment = require("moment");

module.exports = {
    all:() => db.load(`select * from partnerbank`),

    getByID: async(id_bank) => {
       return await db.load(`select * from partnerbank where id_bank = "${id_bank}"`)
    },
    getByCode: async (code_bank) => {
        return await db.load(`select * from partnerbank where code_bank = "${code_bank}"`)
    },
    getByName: async(name_bank) => {
        return await db.load(`select * from partnerbank where name_bank = "${name_bank}"`)        
    },
    
    
}