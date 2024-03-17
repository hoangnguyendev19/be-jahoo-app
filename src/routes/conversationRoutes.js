const express = require("express");
const conversationController = require("../controllers/conversationController");
const authMiddleware = require("../middleware/authMiddleware");
const validator = require("../utils/validator");

const router = express.Router();

router.get(
  "/",
  authMiddleware.protect,
  conversationController.getAllConversationForUser
);

router.get(
  "/same",
  authMiddleware.protect,
  conversationController.getConversationByUserIdAndMe
);

router.post(
  "/",
  validator.validateConversation,
  authMiddleware.protect,
  conversationController.createConversation
);

router.put(
  "/:id/assign-admin",
  authMiddleware.protect,
  conversationController.assignAdminForConversation
);

router.put(
  "/:id/remove-user",
  authMiddleware.protect,
  conversationController.removeUserForConversation
);

router.put(
  "/:id/remove-yourself",
  authMiddleware.protect,
  conversationController.removeYourselfForConversation
);

router.put(
  "/:id/add-user",
  authMiddleware.protect,
  conversationController.addUserForConversation
);

router.get(
  "/:id",
  authMiddleware.protect,
  conversationController.getConversationById
);

router.delete(
  "/:id",
  authMiddleware.protect,
  conversationController.deleteConversation
);

module.exports = router;
