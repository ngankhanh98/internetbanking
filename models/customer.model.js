const db = require('../utils/db');
const bcrypt = require("bcryptjs");
const createError = require("https-error");


module.exports = {
    all: _ => db.load(`select * from customers`),
    detail: username => db.load(`select * from customers where username = "${username}"`),
    add: async (entity) => {
        // table customer {username, password, fullname};
        // entity {username, password, fullname}

        entity.password = bcrypt.hashSync(entity.password, 8);
        try {
            const rows = await db.load(`select * from customers where username = "${entity.username}"`);
        } catch (error) {
            return error;
        }

        return db.add(entity, `customers`);
    },
    update: async(entity) =>{
        const value = Object.assign({}, entity);
        delete value.username;
        try {
            rows = await db.update(value, {username: entity.username}, `customers`);
        } catch (error) {
            return error;
        }
        return rows;
    },
};
