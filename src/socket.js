const Message = require("./models/messageModel");
const User = require("./models/userModel");

const userOnline = new Map();

const socket = (io) => {
  io.on("connection", (socket) => {
    console.log("A user is connected");

    socket.on("login", (userId) => {
      console.log("User ", userId, " online");
      userOnline.set(userId, socket.id);
    });

    socket.on("join_room", ({ conversationId, userId }) => {
      socket.join(conversationId);
      console.log("joined room: ", conversationId, "with user: ", userId);
    });

    socket.on("leave_room", ({ conversationId, userId }) => {
      socket.leave(conversationId);
      console.log("leaved room: ", conversationId, "with user: ", userId);
    });

    socket.on("send_message", async (message) => {
      try {
        const newMessage = await Message.create(message);
        const newMsg = await Message.findById(newMessage.id).populate({
          path: "senderId",
          model: "User",
          select: "fullName avatarUrl",
        });

        io.to(message.conversationId).emit("receive_message", newMsg);
      } catch (error) {
        console.error(error);
      }
    });

    socket.on("revoke_message", async ({ messageId, userId }) => {
      let message = await Message.findById(messageId);

      if (message && message.senderId.toString() === userId) {
        message.isRevoked = true;
        await message.save();
        io.to(message.conversationId.toString()).emit(
          "revoke_message",
          messageId
        );
      }
    });

    socket.on("like_message", async ({ messageId, userId }) => {
      let message = await Message.findById(messageId);

      if (message) {
        message.likes.push(userId);
        await message.save();

        io.to(message.conversationId.toString()).emit(
          "like_message",
          messageId
        );
      }
    });

    socket.on("unlike_message", async ({ messageId, userId }) => {
      let message = await Message.findById(messageId);

      if (message) {
        message.likes = message.likes.filter(
          (uid) => uid.toString() !== userId
        );
        await message.save();

        io.to(message.conversationId.toString()).emit(
          "unlike_message",
          messageId
        );
      }
    });

    socket.on("disconnect", () => {
      console.log("A user is disconnected");
      userOnline.forEach((value, key) => {
        if (value === socket.id) {
          console.log("User ", userOnline.get(key), " offline");
          userOnline.delete(key);
        }
      });
    });
  });
};

module.exports = socket;
