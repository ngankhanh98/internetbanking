const db = require("../utils/db");
const createError = require("https-error");

module.exports = {
    add: async (entity) =>{
        try {
            return await db.add(entity, 'beneficiaries');
        } catch (error) {
            return error
        }
    }
    
};
