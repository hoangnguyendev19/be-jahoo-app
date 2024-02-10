const express = require("express");
const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");
const validator = require("../utils/validator");

const router = express.Router();

router.post("/signup", validator.validateSignup, userController.signup);
router.post("/login", validator.validateLogin, userController.login);
router.delete("/logout", authMiddleware.protect, userController.logout);
// router.post("/refreshToken", userController.requestRefreshToken);

router
  .route("/profile")
  .get(authMiddleware.protect, userController.getUserProfile)
  .put(authMiddleware.protect, userController.updateUserProfile);

router.put(
  "/update-password",
  authMiddleware.protect,
  userController.updatePassword
);

router.put(
  "/request-friend/:friendId",
  authMiddleware.protect,
  userController.requestFriend
);

router.put(
  "/accept-friend/:friendId",
  authMiddleware.protect,
  userController.acceptFriend
);

router.put(
  "/revoke-friend/:friendId",
  authMiddleware.protect,
  userController.revokeFriend
);

router.put(
  "/delete-friend/:friendId",
  authMiddleware.protect,
  userController.deleteFriend
);

module.exports = router;
