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
router.post(
  "/",
  validator.validateConversation,
  authMiddleware.protect,
  conversationController.createConversation
);

router.put(
  "/:conversationId/assign-admin",
  authMiddleware.protect,
  conversationController.assignAdminForConversation
);

router.put(
  "/:conversationId/remove-user",
  authMiddleware.protect,
  conversationController.removeUserForConversation
);

router.put(
  "/:conversationId/remove-yourself",
  authMiddleware.protect,
  conversationController.removeYourselfForConversation
);

router.put(
  "/:conversationId/add-user",
  authMiddleware.protect,
  conversationController.addUserForConversation
);

router.delete(
  "/:conversationId",
  authMiddleware.protect,
  conversationController.deleteConversation
);

module.exports = router;
