const express = require("express");
const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");
const validator = require("../utils/validator");

const router = express.Router();

router.post("/signup", userController.signup);
router.post("/verify-otp", validator.validateSignup, userController.verifyOtp);
router.post("/login", validator.validateLogin, userController.login);
router.delete("/logout", authMiddleware.protect, userController.logout);
router.post("/refresh-token", userController.refreshToken);

router.post("/forgot-password", userController.forgotPassword);
router.get("/reset-password/:token", userController.resetPassword);

router
  .route("/me")
  .get(authMiddleware.protect, userController.getMe)
  .put(
    authMiddleware.protect,
    validator.validateProfile,
    userController.updateMe
  );

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
  "/delete-accept-friend/:friendId",
  authMiddleware.protect,
  userController.deleteAcceptFriend
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

router.get("/admin", authMiddleware.protect, userController.getAllUsers);
router.post("/admin", authMiddleware.protect, userController.createUser);
router.put("/admin/:userId", authMiddleware.protect, userController.updateUser);
router.delete(
  "/admin/:userId",
  authMiddleware.protect,
  userController.deleteUser
);
router.get("/:userId", userController.getUserProfile);
router.get("/", userController.getUserProfileByPhoneNumber);

module.exports = router;
