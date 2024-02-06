const dotenv = require("dotenv");
const createHttpError = require("http-errors");

dotenv.config();

exports.notFound = (req, res, next) => {
  next(createHttpError(404, `Not Found - ${req.originalUrl}`));
};
