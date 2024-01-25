import mongoose from "mongoose";
const Schema = mongoose.Schema;

const conversationSchema = new Schema(
  {
    name: {
      type: String,
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
    userList: [
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

// conversationSchema.virtual("conversationUser", {
//   ref: "User",
//   localField: "_id",
//   foreignField: "conversation",
//   justOne: false,
// });

const Conversation = mongoose.model("conversation", conversationSchema);

export default Conversation;
