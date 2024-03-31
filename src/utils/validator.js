const { body } = require("express-validator");

exports.validateLogin = [
  body("phoneNumber", "Phone number is not empty").trim().notEmpty(),
  body("phoneNumber", "Phone number has maximum ten digits").isLength({
    max: 10,
    min: 10,
  }),
  body("password", "Password is not empty").trim().notEmpty(),
  body("password", "Password has at least ten characters").isLength({
    min: 10,
  }),
];

exports.validateSignup = [
  body("fullName", "Full name is not empty").trim().notEmpty(),
  body("phoneNumber", "Phone number is not empty").trim().notEmpty(),
  body("phoneNumber", "Phone number has maximum ten digits").isLength({
    max: 10,
    min: 10,
  }),
  body("password", "Password is not empty").trim().notEmpty(),
  body("password", "Password has at least ten characters").isLength({
    min: 10,
  }),
  body("email", "Email is not empty").trim().notEmpty(),
  body("email", "Email is valid").isEmail(),
];

exports.validateMessage = [
  body("content", "Content is not empty").trim().notEmpty(),
  body("type", "Type includes TEXT, IMAGE, AUDIO, VIDEO and FILE").matches(
    /\b(?:TEXT|IMAGE|AUDIO|VIDEO|FILE)\b/
  ),
  body("conversationId", "Conversation is not empty").trim().notEmpty(),
  body("senderId", "Sender is not empty").trim().notEmpty(),
];

exports.validateConversation = [
  body("members", "Members is at least two members").isArray({ min: 2 }),
  body("type", "Type includes GROUP and FRIEND").matches(
    /\b(?:GROUP|FRIEND)\b/
  ),
];

exports.validateProfile = [
  body("fullName", "Full name is not empty").trim().notEmpty(),
  body("gender", "Gender is a boolean type").isBoolean(),
  body("dateOfBirth", "Date of birth have yyyy-mm-dd format").isDate(),
  body("email", "Email is not empty").trim().notEmpty(),
  body("email", "Email is valid").isEmail(),
];
