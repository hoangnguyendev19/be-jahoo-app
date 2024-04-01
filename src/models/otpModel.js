const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcryptjs");

const otpSchema = new Schema({
  email: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  time: {
    type: Date,
    default: Date.now,
    index: { expires: 50 },
  },
});

otpSchema.pre("save", async function (next) {
  if (!this.isModified("otp")) {
    return next();
  }

  const salt = bcrypt.genSaltSync(10);
  this.otp = bcrypt.hashSync(this.otp, salt);
  next();
});

otpSchema.methods.checkOtp = async (inputOtp, userOtp) => {
  return await bcrypt.compare(inputOtp, userOtp);
};

const OTP = mongoose.model("Otp", otpSchema);

module.exports = OTP;
