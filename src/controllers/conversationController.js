const createHttpError = require("http-errors");
const Conversation = require("../models/conversationModel");
const User = require("../models/userModel");
const Message = require("../models/messageModel");
const { validationResult } = require("express-validator");

exports.getAllConversationForUser = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      members: { $in: [req.user._id] },
    }).populate({
      path: "members",
      model: "User",
      select: "fullName avatarUrl",
    });
    return res.status(200).json({ status: "success", data: conversations });
  } catch (error) {
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

exports.getConversationById = async (req, res) => {
  try {
    const { id } = req.params;
    const conversation = await Conversation.findById(id).populate({
      path: "members",
      model: "User",
      select: "fullName avatarUrl",
    });

    return res.status(200).json({ status: "success", data: conversation });
  } catch (error) {
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

exports.createConversation = async (req, res) => {
  try {
    const errors = validationResult(req.body);
    if (!errors.isEmpty) {
      return res
        .status(422)
        .json({ status: "fail", message: errors.array()[0].msg });
    }

    const conversation = await Conversation.create(req.body);

    if (conversation) {
      await conversation.save();

      const newConversation = await Conversation.findById(
        conversation.id
      ).populate({
        path: "members",
        model: "User",
        select: "fullName avatarUrl",
      });

      return res.status(200).json({
        status: "success",
        data: newConversation,
      });
    }
  } catch (error) {
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

exports.assignAdminForConversation = async (req, res) => {
  try {
    const { userId } = req.body;
    const { id } = req.params;
    const user = await User.findById(userId);
    let conversation = await Conversation.findById(id);
    if (user && conversation) {
      if (conversation.admin.toString() !== req.user._id.toString()) {
        return res.status(401).json({
          status: "fail",
          message: "You are not admin for this conversation",
        });
      }

      if (!conversation.members.includes(userId)) {
        return res.status(401).json({
          status: "fail",
          message: "User isn't a member into this conversation",
        });
      }

      conversation.admin = userId;
      await conversation.save();
      return res.status(200).json({
        status: "success",
        message: "You assigned admin for this conversation successfully",
      });
    } else {
      return res
        .status(404)
        .json({ status: "fail", message: "User or Conversation is not found" });
    }
  } catch (error) {
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

exports.removeUserForConversation = async (req, res) => {
  try {
    const { userId } = req.body;
    const { id } = req.params;
    const user = await User.findById(userId);
    let conversation = await Conversation.findById(id);
    if (user && conversation) {
      if (conversation.admin.toString() !== req.user._id.toString()) {
        return res.status(401).json({
          status: "fail",
          message: "You are not admin for this conversation",
        });
      }

      if (!conversation.members.includes(userId)) {
        return res.status(401).json({
          status: "fail",
          message: "User isn't a member into this conversation",
        });
      }

      conversation.members = conversation.members.filter(
        (memId) => memId.toString() !== userId
      );
      if (conversation.members.length === 1) {
        await Conversation.findByIdAndDelete(id);
      } else {
        await conversation.save();
      }

      return res.status(200).json({
        status: "success",
        message: "You removed user for this conversation successfully!",
      });
    } else {
      return res
        .status(404)
        .json({ status: "fail", message: "User or Conversation is not found" });
    }
  } catch (error) {
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

exports.removeYourselfForConversation = async (req, res) => {
  try {
    const { id } = req.params;
    let conversation = await Conversation.findById(id);
    if (!conversation) {
      return res
        .status(404)
        .json({ status: "fail", message: "Conversation is not found" });
    }

    if (conversation.admin.toString() === req.user._id.toString()) {
      return res.status(401).json({
        status: "fail",
        message:
          "You should assign admin for other before removing this conversation!",
      });
    }

    conversation.members = conversation.members.filter(
      (memId) => memId.toString() !== req.user._id.toString()
    );
    if (conversation.members.length === 1) {
      await Conversation.findByIdAndDelete(id);
    } else {
      await conversation.save();
    }

    return res.status(200).json({
      status: "success",
      message: "You removed yourself for this conversation successfully!",
    });
  } catch (error) {
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

exports.addUserForConversation = async (req, res) => {
  try {
    const { userId } = req.body;
    const { id } = req.params;

    const user = await User.findById(userId).populate("fullName avatarUrl");
    const conversation = await Conversation.findById(id);

    if (conversation && user) {
      if (!conversation.members.includes(req.user._id.toString())) {
        return res.status(401).json({
          status: "fail",
          message: "You aren't a member into this conversation",
        });
      }

      conversation.members.push(userId);
      await conversation.save();
      return res.status(200).json({
        status: "success",
        data: user,
      });
    } else {
      return res.status(404).json({
        status: "fail",
        message: "User or Conversation is not found!",
      });
    }
  } catch (error) {
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

exports.deleteConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const conversation = await Conversation.findById(id);
    if (
      conversation.type === "GROUP" &&
      conversation.admin.toString() !== req.user._id.toString()
    ) {
      return res.status(401).json({
        status: "fail",
        message: "You are not admin for this conversation",
      });
    }
    await Message.deleteMany({ conversationId: id });
    await Conversation.findByIdAndDelete(id);
    return res.status(200).json({
      status: "success",
      message: "You deleted this conversation successfully!",
    });
  } catch (error) {
    return res.status(500).json({ status: "fail", message: error.message });
  }
};
