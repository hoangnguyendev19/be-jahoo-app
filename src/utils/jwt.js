const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

exports.signToken = (id) => {
  const token = jwt.sign({ id }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
  });
  return token;
};

exports.signRefreshToken = (id) => {
  const token = jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
  });

  return token;
};
