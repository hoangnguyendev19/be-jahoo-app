const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const OTP = require("../models/otpModel");
const { validationResult } = require("express-validator");
const transporter = require("../configs/nodemailer");
const otpGenerator = require("otp-generator");

dotenv.config();

const {
  signToken,
  signRefreshToken,
  verifyRefreshToken,
  removeRefreshToken,
} = require("../utils/jwt");

// refreshToken
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({
        status: "fail",
        message: "You are not authenticated",
      });
    }

    const decoded = verifyRefreshToken(refreshToken);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User is not found",
      });
    }

    const accessToken = signToken(user._id);
    const newRefreshToken = signRefreshToken(user._id);

    return res.status(200).json({
      status: "success",
      data: {
        accessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

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
    const refreshToken = signRefreshToken(user._id);

    user = await User.findOne({ phoneNumber })
      .select(
        "-password -passwordResetToken -passwordResetExpires -createdAt -updatedAt"
      )
      .populate({
        path: "friendList",
        model: "User",
        select: "fullName avatarUrl",
      })
      .populate({
        path: "sendedRequestList",
        model: "User",
        select: "fullName avatarUrl",
      })
      .populate({
        path: "receivedRequestList",
        model: "User",
        select: "fullName avatarUrl",
      });

    return res.status(200).json({
      status: "success",
      data: {
        user,
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

// Register
exports.signup = async (req, res) => {
  try {
    const { email, phoneNumber } = req.body;
    const user = await User.findOne({
      $or: [{ email }, { phoneNumber }],
    });

    if (user) {
      return res.status(400).json({
        status: "fail",
        message: "Email or phone number already exists",
      });
    }

    const otp = otpGenerator.generate(6, {
      digits: true,
      upperCase: false,
      specialChars: false,
      alphabets: false,
    });

    await OTP.create({ email, otp });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Xác nhận đăng ký tài khoản",
      html: `
        <p>Mã OTP của bạn là: ${otp}. Thời hạn hiệu lực trong vòng 30s.</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({
      status: "success",
      message: "OTP has been sent to your email",
    });
  } catch (error) {
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(422)
        .json({ status: "fail", message: errors.array()[0].msg });
    }

    const { fullName, phoneNumber, password, email, otp } = req.body;

    const otpArray = await OTP.find({ email });

    if (otpArray.length === 0) {
      return res.status(404).json({
        status: "fail",
        message: "OTP is not found",
      });
    }

    const otpObj = otpArray[otpArray.length - 1];

    const isValidOtp = await otpObj.checkOtp(otp, otpObj.otp);

    if (!isValidOtp) {
      return res.status(404).json({
        status: "fail",
        message: "OTP is invalid",
      });
    }

    const newUser = await User.create({
      fullName,
      phoneNumber,
      email,
      password,
    });

    if (newUser) {
      const accessToken = signToken(newUser._id);
      const refreshToken = signRefreshToken(newUser._id);

      const user = await User.findById(newUser.id)
        .select(
          "-password -passwordResetToken -passwordResetExpires -createdAt -updatedAt"
        )
        .populate({
          path: "friendList",
          model: "User",
          select: "fullName avatarUrl",
        })
        .populate({
          path: "sendedRequestList",
          model: "User",
          select: "fullName avatarUrl",
        })
        .populate({
          path: "receivedRequestList",
          model: "User",
          select: "fullName avatarUrl",
        });

      return res.status(200).json({
        status: "success",
        data: { user, accessToken, refreshToken },
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
    removeRefreshToken(req.user._id);

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

// Forgot password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({ status: "fail", message: "User not found" });
    }

    // Generate a password reset token and set its expiration date
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_RESET_PASSWORD_SECRET,
      { expiresIn: process.env.JWT_RESET_PASSWORD_EXPIRES_IN }
    );

    user.passwordResetToken = token;
    user.passwordResetExpires = Date.now() + 60000 * 15; // 15 minutes
    await user.save();

    // const resetUrl = `http://${req.headers.host}/api/v1/users/reset-password/${token}`;
    const resetUrl = `http://localhost:5000/api/v1/users/reset-password/${token}`;
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Yêu cầu làm mới mật khẩu",
      html: `
      <p>Bạn muốn làm mới mật khẩu. Hãy click vào đường link dưới đây:</p>
      <a href="${resetUrl}">Làm mới mật khẩu</a>
    `,
    };

    await transporter.sendMail(mailOptions);

    res
      .status(200)
      .json({ status: "success", message: "Password reset email sent" });
  } catch (err) {
    console.error("Failed to send password reset email:", err);
    res
      .status(500)
      .json({ status: "fail", message: "Failed to send password reset email" });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, process.env.JWT_RESET_PASSWORD_SECRET);
  } catch (err) {
    return res.status(200).sendFile("error.html", { root: "./src/views" });
  }

  try {
    const user = await User.findOne({
      _id: decodedToken.id,
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      res.status(404).json({
        status: "fail",
        message: "User not found or token is invalid or expired",
      });
    }

    // Generate a random password for the user
    const newPassword = Math.random().toString(36).slice(-10).toUpperCase();
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Send a confirmation email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Xác nhận làm mới mật khẩu",
      html: `
      <p>Mật khẩu mới của bạn: ${newPassword}</p>
      <p>Nếu bạn không yêu cầu làm mới mật khẩu, hãy đổi mật khẩu ngay lập tức.</p>
    `,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).sendFile("success.html", { root: "./src/views" });
  } catch (err) {
    console.error("Failed to send password reset confirmation email:", err);
    res.status(500).json({
      status: "fail",
      message: "Failed to send password reset confirmation email",
    });
  }
};

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select(
      "-password -passwordResetToken -passwordResetExpires -createdAt -updatedAt"
    );

    if (users) {
      return res.status(200).json({
        status: "success",
        data: users,
      });
    } else {
      return res.status(404).json({
        status: "fail",
        message: "Users are not found",
      });
    }
  } catch (error) {
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

// Get me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select(
        "-password -passwordResetToken -passwordResetExpires -createdAt -updatedAt"
      )
      .populate({
        path: "friendList",
        model: "User",
        select: "fullName avatarUrl",
      })
      .populate({
        path: "sendedRequestList",
        model: "User",
        select: "fullName avatarUrl",
      })
      .populate({
        path: "receivedRequestList",
        model: "User",
        select: "fullName avatarUrl",
      });

    if (user) {
      return res.status(200).json({
        status: "success",
        data: user,
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

// Get user profile
exports.getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(userId);
    const user = await User.findById(userId).select(
      "-password -passwordResetToken -passwordResetExpires -createdAt -updatedAt"
    );

    if (user) {
      return res.status(200).json({
        status: "success",
        data: user,
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

// Get user profile by phone number
exports.getUserProfileByPhoneNumber = async (req, res) => {
  try {
    const { phoneNumber } = req.query;
    const user = await User.findOne({ phoneNumber }).select(
      "-password -passwordResetToken -passwordResetExpires -createdAt -updatedAt"
    );

    if (user) {
      return res.status(200).json({
        status: "success",
        data: user,
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

// Update me
exports.updateMe = async (req, res) => {
  try {
    const errors = validationResult(req.body);
    if (!errors.isEmpty) {
      return res
        .status(422)
        .json({ status: "fail", message: errors.array()[0].msg });
    }
    const { fullName, gender, dateOfBirth, avatarUrl, coverImage, email } =
      req.body;
    let user = await User.findById(req.user._id).select("-password");

    if (user) {
      user.fullName = fullName;
      user.gender = gender;
      user.email = email;
      user.dateOfBirth = dateOfBirth;
      user.avatarUrl = avatarUrl;
      user.coverImage = coverImage;
      user.updatedAt = Date.now();

      await user.save();

      const newUser = await User.findById(req.user._id)
        .select(
          "-password -passwordResetToken -passwordResetExpires -createdAt -updatedAt"
        )
        .populate({
          path: "friendList",
          model: "User",
          select: "fullName avatarUrl",
        })
        .populate({
          path: "sendedRequestList",
          model: "User",
          select: "fullName avatarUrl",
        })
        .populate({
          path: "receivedRequestList",
          model: "User",
          select: "fullName avatarUrl",
        });

      return res.status(200).json({
        status: "success",
        data: newUser,
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

      const newUser = await User.findById(req.user._id)
        .select(
          "-password -passwordResetToken -passwordResetExpires -createdAt -updatedAt"
        )
        .populate({
          path: "friendList",
          model: "User",
          select: "fullName avatarUrl",
        })
        .populate({
          path: "sendedRequestList",
          model: "User",
          select: "fullName avatarUrl",
        })
        .populate({
          path: "receivedRequestList",
          model: "User",
          select: "fullName avatarUrl",
        });

      return res.status(200).json({
        status: "success",
        data: newUser,
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

      const newUser = await User.findById(req.user._id)
        .select(
          "-password -passwordResetToken -passwordResetExpires -createdAt -updatedAt"
        )
        .populate({
          path: "friendList",
          model: "User",
          select: "fullName avatarUrl",
        })
        .populate({
          path: "sendedRequestList",
          model: "User",
          select: "fullName avatarUrl",
        })
        .populate({
          path: "receivedRequestList",
          model: "User",
          select: "fullName avatarUrl",
        });

      return res.status(200).json({
        status: "success",
        data: newUser,
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

// Delete Accept friend
exports.deleteAcceptFriend = async (req, res) => {
  try {
    const { friendId } = req.params;
    let user = await User.findById(req.user._id);
    let friend = await User.findById(friendId);
    if (user && friend) {
      user.receivedRequestList = user.receivedRequestList.filter(
        (userId) => userId.toString() !== friendId
      );
      friend.sendedRequestList = friend.sendedRequestList.filter(
        (userId) => userId.toString() !== req.user._id.toString()
      );
      await user.save();
      await friend.save();

      const newUser = await User.findById(req.user._id)
        .select(
          "-password -passwordResetToken -passwordResetExpires -createdAt -updatedAt"
        )
        .populate({
          path: "friendList",
          model: "User",
          select: "fullName avatarUrl",
        })
        .populate({
          path: "sendedRequestList",
          model: "User",
          select: "fullName avatarUrl",
        })
        .populate({
          path: "receivedRequestList",
          model: "User",
          select: "fullName avatarUrl",
        });

      return res.status(200).json({
        status: "success",
        data: newUser,
      });
    } else {
      return res.status(404).json({
        status: "fail",
        message: "You deleted this accept friend failure!",
      });
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

      const newUser = await User.findById(req.user._id)
        .select(
          "-password -passwordResetToken -passwordResetExpires -createdAt -updatedAt"
        )
        .populate({
          path: "friendList",
          model: "User",
          select: "fullName avatarUrl",
        })
        .populate({
          path: "sendedRequestList",
          model: "User",
          select: "fullName avatarUrl",
        })
        .populate({
          path: "receivedRequestList",
          model: "User",
          select: "fullName avatarUrl",
        });

      return res.status(200).json({
        status: "success",
        data: newUser,
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

      const newUser = await User.findById(req.user._id)
        .select(
          "-password -passwordResetToken -passwordResetExpires -createdAt -updatedAt"
        )
        .populate({
          path: "friendList",
          model: "User",
          select: "fullName avatarUrl",
        })
        .populate({
          path: "sendedRequestList",
          model: "User",
          select: "fullName avatarUrl",
        })
        .populate({
          path: "receivedRequestList",
          model: "User",
          select: "fullName avatarUrl",
        });

      return res.status(200).json({
        status: "success",
        data: newUser,
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
