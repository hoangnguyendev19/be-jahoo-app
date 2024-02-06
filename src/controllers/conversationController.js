const createHttpError = require("http-errors");
const Conversation = require("../models/conversationModel");
const { validationResult } = require("express-validator");

exports.getAllConversationForUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const conversations = await Conversation.find({
      members: { $in: [userId] },
    });
    return res.status(200).json({ status: "success", data: conversations });
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
      return res.status(200).json({ status: "success", data: conversation });
    }
  } catch (error) {
    return res.status(500).json({ status: "fail", message: error.message });
  }
};
