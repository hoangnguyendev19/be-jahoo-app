const dotenv = require("dotenv");
const connectDB = require("./connectDB");
const Message = require("../models/messageModel");
const User = require("../models/userModel");
const Conversation = require("../models/conversationModel");
const Messages = require("../data/messages");
const Users = require("../data/users");
const Conversations = require("../data/conversations");

dotenv.config();

connectDB();

const insertData = async () => {
  try {
    await User.deleteMany();
    await Message.deleteMany();
    await Conversation.deleteMany();
    await User.create(Users);
    await Message.create(Messages);
    await Conversation.create(Conversations);

    console.log("Data inserted");
  } catch (error) {
    console.log(error.message);
  }
};

const deleteData = async () => {
  try {
    await User.deleteMany();
    await Message.deleteMany();
    await Conversation.deleteMany();
    console.log("Data deleted");
  } catch (error) {
    console.log(error.message);
  }
};

if (process.argv[2] === "-i") {
  insertData();
} else {
  deleteData();
}
