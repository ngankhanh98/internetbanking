const config = require('../config/default.json');

const createError = require("https-error");
const {authenticator} = require( 'otplib');

module.exports = {
  verify: (req, res, next) => {
    const token = req.headers["x-access-token"];
    if (token) {
      jwt.verify(token, config.auth.key, function (err, payload) {
        if (err) throw new createError(401, err);

        console.log(payload);
        next();
      });
    } else {
      throw new createError(401, "No access token found");
    }

  },
  generateOTP: (username) => {
    authenticator.options={step: 180}   
    try {
       const token = authenticator.generate(username);
       console.log(token);
       return token;
    }
    catch (err){
      throw err;
    }
    
  },
  verifyOTP(token, username){
    try {
    
      const isValid = authenticator.check(token, username);
      if (!isValid) throw new createError(401, "OTP is not valid");
      return isValid;

    } catch (err) {
      console.error(err);
     throw err;
    }
  }
};
