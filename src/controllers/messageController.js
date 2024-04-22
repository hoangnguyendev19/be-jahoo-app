const createHttpError = require("http-errors");
const Message = require("../models/messageModel");
const { validationResult } = require("express-validator");

exports.getAllMessageForConversation = async (req, res) => {
  try {
    const { conversation } = req.query;
    const messages = await Message.find({
      conversationId: conversation,
    }).populate({
      path: "senderId",
      model: "User",
      select: "fullName avatarUrl",
    });

    return res.status(200).json({
      status: "success",
      data: messages,
    });
  } catch (error) {
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

exports.getLatestMessageForConversation = async (req, res) => {
  try {
    const { conversation } = req.query;
    const message = await Message.findOne({
      conversationId: conversation,
    })
      .sort({ createdAt: -1 })
      .populate({
        path: "senderId",
        model: "User",
        select: "fullName avatarUrl",
      });

    if (!message) {
      return res.status(404).json({
        status: "fail",
        message: "Message not found",
      });
    }

    return res.status(200).json({
      status: "success",
      data: message,
    });
  } catch (error) {
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

exports.createMessage = async (req, res) => {
  try {
    const errors = validationResult(req.body);
    if (!errors.isEmpty) {
      return res
        .status(422)
        .json({ status: "fail", message: errors.array()[0].msg });
    }

    const message = await Message.create(req.body);
    if (message) {
      return res.status(200).json({ status: "success", data: message });
    } else {
      return res
        .status(400)
        .json({ status: "fail", message: "You created this message failure!" });
    }
  } catch (error) {
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

exports.revokeMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    let message = await Message.findById(messageId).populate({
      path: "senderId",
      model: "User",
      select: "fullName avatarUrl",
    });

    if (message && message.senderId.toString() === req.user._id.toString()) {
      message.isRevoked = true;
      await message.save();

      return res.status(200).json({
        status: "success",
        data: message,
      });
    } else {
      return res
        .status(404)
        .json({ status: "fail", message: "You revoked this message failure!" });
    }
  } catch (error) {
    return res.status(500).json({ status: "fail", message: error.message });
  }
};
