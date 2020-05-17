const db = require("../utils/db");
const dbName = "ebanking";
module.exports = {
    all:() => db.load(`select * from account`),

    getByUsrName: (username) => {
       return db.load(`select * from account where username = "${username}"`)
    },
    getByAccNumber: (account_number) => {
        const accnumber =  parseInt(account_number);
        return db.load(`select * from account where account_number = ${accnumber}`)
    },
    

}