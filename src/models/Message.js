import mongoose from "mongoose";
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
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedUserId: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
    replyMessageId: {
      type: mongoose.Schema.ObjectId,
      ref: "Message",
    },
    conversationId: {
      type: mongoose.Schema.ObjectId,
      ref: "Conversation",
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

export default Message;
