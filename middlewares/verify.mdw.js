const config = require('../config/default.json');
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
};
