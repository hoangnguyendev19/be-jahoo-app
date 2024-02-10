const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const createHttpError = require("http-errors");
const User = require("../models/userModel");
const { validationResult } = require("express-validator");

dotenv.config();

const { signToken, signRefreshToken } = require("../utils/jwt");

let refreshTokenList = [];

// refreshToken
// exports.requestRefreshToken = async (req, res) => {
//   try {
//     const refreshToken = req.cookies.refreshToken;

//   if (!refreshToken) {
//     return res
//       .status(400)
//       .json({
//         status: "fail",
//         message: "You have'nt logged in yet. Please log in to get access!",
//       });
//   }

//   if (!refreshTokenList.includes(refreshToken)) {
//     return res
//       .status(403)
//       .json({ status: "fail", message: "Refresh token is invalid" });
//   }

//   refreshTokenList = refreshTokenList.filter((token) => token !== refreshToken);

//   const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
//   const newAccessToken = signToken(decoded.id);
//   const newRefreshToken = signRefreshToken(decoded.id);

//   refreshTokenList.push(newRefreshToken);

//   res.cookie("refreshToken", newRefreshToken, {
//     httpOnly: true,
//     secure: true,
//     path: "/",
//     sameSite: "strict",
//   });

//   res.status(200).json({
//     status: "success",
//     accessToken: newAccessToken,
//   });
//   } catch (error) {
//     return res.status(500).json({ status: "fail", message: error.message });
//   }
// };

// Login
exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(422)
        .json({ status: "fail", message: errors.array()[0].msg });
    }

    const { phoneNumber, password } = req.body;

    let user = await User.findOne({ phoneNumber });
    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "Phone number and password is invalid",
      });
    }

    const isValidPassword = await user.checkPassword(password, user.password);

    if (!isValidPassword) {
      return res
        .status(404)
        .json({ status: "fail", message: "Password is invalid" });
    }

    const accessToken = signToken(user._id);
    // const refreshToken = signRefreshToken(user._id);

    // refreshTokenList.push(refreshToken);
    // res.cookie("refreshToken", refreshToken, {
    //   httpOnly: true,
    //   secure: true,
    //   path: "/",
    //   sameSite: "strict",
    // });

    user = await User.findOne({ phoneNumber }).select("-password");

    return res.status(200).json({
      status: "success",
      data: {
        user,
        accessToken,
      },
    });
  } catch (error) {
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

// Register
exports.signup = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(422)
        .json({ status: "fail", message: errors.array()[0].msg });
    }
    const { phoneNumber } = req.body;
    const userExists = await User.findOne({ phoneNumber });

    if (userExists) {
      return res
        .status(400)
        .json({ status: "fail", message: "User already exists" });
    }
    const newUser = await User.create(req.body);

    const accessToken = signToken(newUser._id);

    if (newUser) {
      const user = await User.findById(newUser._id).select("-password");
      return res.status(200).json({
        status: "success",
        data: {
          user,
          accessToken,
        },
      });
    } else {
      return res
        .status(400)
        .json({ status: "fail", message: "User is invalid" });
    }
  } catch (error) {
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

// Logout
exports.logout = async (req, res) => {
  try {
    // refreshTokenList = refreshTokenList.filter(
    //   (token) => token !== req.cookies.refreshToken
    // );
    // res.clearCookie("refreshToken");
    return res.status(200).json({
      status: "success",
      message: "You logged out successfully!",
    });
  } catch (error) {
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

// Update password
exports.updatePassword = async (req, res) => {
  try {
    const { password, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    const isValidPassword = await user.checkPassword(password, user.password);

    if (!isValidPassword) {
      return res
        .status(404)
        .json({ status: "fail", message: "Old password is invalid" });
    }

    user.password = newPassword;
    user.updatedAt = Date.now();
    await user.save();

    res.status(200).json({
      status: "success",
      message: "You updated this password successfully!",
    });
  } catch (error) {
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

// Get user profile
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (user) {
      return res.status(200).json({
        status: "success",
        data: { user },
      });
    } else {
      return res.status(404).json({
        status: "fail",
        message: "User is not found",
      });
    }
  } catch (error) {
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

// Update user profile
exports.updateUserProfile = async (req, res) => {
  try {
    const errors = validationResult(req.body);
    if (!errors.isEmpty) {
      return res
        .status(422)
        .json({ status: "fail", message: errors.array()[0].msg });
    }
    const { fullName, gender, dateOfBirth, avatarUrl, coverImage } = req.body;
    let user = await User.findById(req.user._id).select("-password");

    if (user) {
      user.fullName = fullName;
      user.gender = gender;
      user.dateOfBirth = dateOfBirth;
      user.avatarUrl = avatarUrl;
      user.coverImage = coverImage;
      user.updatedAt = Date.now();

      await user.save();
      return res.status(200).json({
        status: "success",
        message: "You updated this profile successfully!",
      });
    } else {
      return res.status(404).json({
        status: "fail",
        message: "User is not found",
      });
    }
  } catch (error) {
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

// Request friend
exports.requestFriend = async (req, res) => {
  try {
    const { friendId } = req.params;
    let user = await User.findById(req.user._id);
    let friend = await User.findById(friendId);
    if (user && friend) {
      user.sendedRequestList.push(friendId);
      await user.save();
      friend.receivedRequestList.push(req.user._id);
      await friend.save();
      return res.status(200).json({
        status: "success",
        message: "You requested this friend successfully!",
      });
    } else {
      return res.status(404).json({
        status: "fail",
        message: "You requested this friend failure!",
      });
    }
  } catch (error) {
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

// Accept friend
exports.acceptFriend = async (req, res) => {
  try {
    const { friendId } = req.params;
    let user = await User.findById(req.user._id);
    let friend = await User.findById(friendId);
    if (user && friend) {
      user.friendList.push(friendId);
      friend.friendList.push(req.user._id);
      user.receivedRequestList = user.receivedRequestList.filter(
        (userId) => userId.toString() !== friendId
      );
      friend.sendedRequestList = friend.sendedRequestList.filter(
        (userId) => userId.toString() !== req.user._id.toString()
      );
      await user.save();
      await friend.save();
      return res.status(200).json({
        status: "success",
        message: "You accepted this friend successfully!",
      });
    } else {
      return res
        .status(404)
        .json({ status: "fail", message: "You accepted this friend failure!" });
    }
  } catch (error) {
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

// Revoke friend
exports.revokeFriend = async (req, res) => {
  try {
    const { friendId } = req.params;
    let user = await User.findById(req.user._id);
    let friend = await User.findById(friendId);
    if (user && friend) {
      user.sendedRequestList = user.sendedRequestList.filter(
        (userId) => userId.toString() !== friendId
      );
      friend.receivedRequestList = friend.receivedRequestList.filter(
        (userId) => userId.toString() !== req.user._id.toString()
      );
      await user.save();
      await friend.save();
      return res.status(200).json({
        status: "success",
        message: "You revoked friend this successfully!",
      });
    } else {
      return res
        .status(404)
        .json({ status: "fail", message: "You revoked this friend failure!" });
    }
  } catch (error) {
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

// Delete friend
exports.deleteFriend = async (req, res) => {
  try {
    const { friendId } = req.params;
    let user = await User.findById(req.user._id);
    let friend = await User.findById(friendId);
    if (user && friend) {
      user.friendList = user.friendList.filter(
        (userId) => userId.toString() !== friendId
      );
      friend.friendList = friend.friendList.filter(
        (userId) => userId.toString() !== req.user._id.toString()
      );
      await user.save();
      await friend.save();
      return res.status(200).json({
        status: "success",
        message: "You deleted this friend successfully!",
      });
    } else {
      return res.status(404).json({
        status: "fail",
        message: "You deleted this friend failure!",
      });
    }
  } catch (error) {
    return res.status(500).json({ status: "fail", message: error.message });
  }
};
