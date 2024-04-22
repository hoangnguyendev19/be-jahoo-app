const express = require("express");
const messageController = require("../controllers/messageController");
const authMiddleware = require("../middleware/authMiddleware");
const validator = require("../utils/validator");

const router = express.Router();

router.get(
  "/",
  authMiddleware.protect,
  messageController.getAllMessageForConversation
);

router.get(
  "/latest",
  authMiddleware.protect,
  messageController.getLatestMessageForConversation
);

router.post(
  "/",
  validator.validateMessage,
  authMiddleware.protect,
  messageController.createMessage
);

router.put(
  "/:messageId",
  authMiddleware.protect,
  messageController.revokeMessage
);

module.exports = router;
