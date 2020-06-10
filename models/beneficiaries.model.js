const db = require("../utils/db");
const createError = require("https-error");

const model = {
    add: async (entity) =>{
        try {
            return await db.add(entity, 'beneficiaries');
        } catch (error) {
            return error
        }
    },
    getAllByUsername: async (username)=> {
        try {
            return await db.load(`select * from beneficiaries where customer_username = "${username}"`)
        } catch (error) {
            return error
        }
    }
};
module.exports = model;