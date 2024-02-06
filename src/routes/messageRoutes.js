const express = require("express");
const messageController = require("../controllers/messageController");
const authMiddleware = require("../middleware/authMiddleware");
const validator = require("../utils/validator");

const router = express.Router();

router.get(
  "/:conversationId",
  authMiddleware.protect,
  messageController.getAllMessageForConversation
);
router.post(
  "/",
  validator.validateMessage,
  authMiddleware.protect,
  messageController.createMessage
);

module.exports = router;
