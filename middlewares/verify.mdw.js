const config = require('../config/default.json');

const createError = require("https-error");
const { authenticator } = require('otplib');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'yahoo',
  auth: {
    user: 'nklbank@yahoo.com',
    pass: '&pwcdpGgP+A#yv3d'
  }
});

var mailOptions = {
  from: 'nklbank@yahoo.com',
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
  generateOTP: (username, email) => {
    authenticator.options = { step: 180 }
    try {
      const token = authenticator.generate(username);
      console.log(token);
      mailOptions= {
        ...mailOptions,
        html: '<p>The email from nklbank</b><ul><li>Username:' + username + '</li><li>Email:' + email + '</li><li>Your OTP:' + token + '</li></ul>',
        to: email,
      }
      
      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.error(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });
      return token;
    }
    catch (err) {
      throw err;
    }

  },
  verifyOTP(token, username) {
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
