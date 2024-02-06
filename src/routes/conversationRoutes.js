const express = require("express");
const conversationController = require("../controllers/conversationController");
const authMiddleware = require("../middleware/authMiddleware");
const validator = require("../utils/validator");

const router = express.Router();

router.get(
  "/:userId",
  authMiddleware.protect,
  conversationController.getAllConversationForUser
);
router.post(
  "/",
  validator.validateConversation,
  authMiddleware.protect,
  conversationController.createConversation
);

module.exports = router;
