const config = require('../config/default.json');

const createError = require("https-error");
const { authenticator } = require('otplib');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'nkl.banking.14@gmail.com',
    pass: '&pwcdpGgP+A#yv3d'
  }
});

var mailOptions = {
  from: 'nkl.banking.14@gmail.com',
  to: '',
  subject: 'Verify your OTP',
  text: 'That was easy!'
};
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
  generateOTP: async (secrect, email) => {
    authenticator.options = { step: 180 }
    try {
      console.log(secrect);
      const token = authenticator.generate(secrect);
      mailOptions= {
        ...mailOptions,
        html: '<p>The email from nklbank</b><ul><li>Email:' + email + '</li><li>Your OTP:' + token + '</li><li>This code will expire 3 minutes after this email was send</li></ul>',
        to: email,
      }
      
      const {error, info} =  await transporter.sendMail(mailOptions);
      if (error) throw error;      
      return token;
    }
    catch (err) {
      throw err;
    }

  },
  verifyOTP(token, secrect) {
    try {

      const isValid = authenticator.check(token, secrect);
      if (!isValid) throw new createError(401, "OTP is not valid");
      return isValid;

    } catch (err) {
      console.error(err);
      throw err;
    }
  }
};
