import mongoose from "mongoose";
import bcrypt from "bcryptjs";
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    gender: {
      type: Boolean,
      default: false,
    },
    dateOfBirth: {
      type: Date,
      default: new Date("2000-01-01"),
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      length: [10, "Phone number has ten digits"],
    },
    password: {
      type: String,
      required: true,
    },
    avatarUrl: {
      type: String,
      default: "",
    },
    coverImage: {
      type: String,
      default: "",
    },
    friendList: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
    ],
    friendRequestList: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
    ],
    conversationList: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "Conversation",
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

// userSchema.virtual("userConversation", {
//   ref: "Conversation",
//   localField: "_id",
//   foreignField: "conversation",
//   justOne: false,
// });

// userSchema.virtual("users", {
//   ref: "User",
//   localField: "_id",
//   foreignField: "User",
//   justOne: false,
// });

userSchema.pre("save", function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  const salt = bcrypt.genSaltSync(10);
  this.password = bcrypt.hashSync(this.password, salt);
  next();
});

const User = mongoose.model("User", userSchema);

export default User;
