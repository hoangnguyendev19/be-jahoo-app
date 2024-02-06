const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();
mongoose.set("strictQuery", true);

// const uriDB = process.env.DATABASE.replace(
//   "<password>",
//   process.env.DATABASE_PASSWORD
// );

const uriDB = process.env.DATABASE_LOCAL;

const connectDB = async () => {
  try {
    const conn = mongoose.connect(uriDB, {});

    console.log(`MongoDB connected successfully !`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
