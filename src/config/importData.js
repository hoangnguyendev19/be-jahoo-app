import dotenv from "dotenv";
import connectDB from "./connectDB.js";
import Message from "../models/Message.js";
import Messages from "../data/Messages.js";
import User from "../models/User.js";
import Users from "../data/users.js";
import Conversation from "../models/Conversation.js";
import Conversations from "../data/Conversations.js";

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
