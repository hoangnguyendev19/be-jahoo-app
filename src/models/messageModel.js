const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const messageSchema = new Schema(
  {
    content: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["TEXT", "IMAGE", "AUDIO", "VIDEO", "FILE"],
      required: true,
    },
    isRevoked: {
      type: Boolean,
      default: false,
    },
    conversationId: {
      type: mongoose.Schema.ObjectId,
      ref: "Conversation",
    },
    senderId: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
    likes: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    updatedAt: {
      type: Date,
      default: Date.now(),
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    versionKey: false,
  }
);

const Message = mongoose.model("message", messageSchema);

module.exports = Message;
