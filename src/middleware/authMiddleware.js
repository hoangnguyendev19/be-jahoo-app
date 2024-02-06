const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const createHttpError = require("http-errors");
const User = require("../models/userModel");

dotenv.config();

exports.protect = async (req, res, next) => {
  try {
    let token = null;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        status: "fail",
        message: "You have'nt logged in yet. Please log in to get access!",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        status: "fail",
        message:
          "The user belonging to this token does no longer exist. Please log in again!",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({ status: "fail", message: error.message });
  }
};
