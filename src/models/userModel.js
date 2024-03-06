const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
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
      length: 10,
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
    sendedRequestList: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
    ],
    receivedRequestList: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    versionKey: false,
  }
);

userSchema.pre("save", function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  const salt = bcrypt.genSaltSync(10);
  this.password = bcrypt.hashSync(this.password, salt);
  next();
});

userSchema.methods.checkPassword = async (inputPassword, userPassword) => {
  return await bcrypt.compare(inputPassword, userPassword);
};

const User = mongoose.model("User", userSchema);

module.exports = User;
