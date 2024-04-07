const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const client = require("../configs/connectRedis");
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

  client.set(id.toString(), token, "EX", 24 * 3600, (error, reply) => {
    if (error) {
      return Error.sendError(res, error);
    }

    if (reply !== "OK") {
      return Error.sendError(res, "Token not set");
    }

    return token;
  });

  return token;
};

exports.verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
};

exports.verifyRefreshToken = (token) => {
  const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

  client.get(decoded.id.toString(), (error, reply) => {
    if (error) {
      return Error.sendError(res, error);
    }
    if (reply !== token) {
      return Error.sendError(res, "Invalid token");
    }

    return decoded;
  });

  return decoded;
};

exports.removeRefreshToken = (id) => {
  client.del(id.toString(), (error, reply) => {
    if (error) {
      return Error.sendError(res, error);
    }

    if (reply !== 1) {
      return Error.sendError(res, "Token not deleted");
    }

    return reply;
  });
};
