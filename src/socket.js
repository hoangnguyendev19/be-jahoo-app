const Conversation = require("./models/conversationModel");
const Message = require("./models/messageModel");
const User = require("./models/userModel");

const userOnline = new Map();

const socket = (io) => {
  io.on("connection", (socket) => {
    console.log("A user is connected");

    socket.on("login", (userId) => {
      console.log("User ", userId, " online ");
      userOnline.set(userId, socket.id);
    });

    socket.on("logout", (userId) => {
      console.log("User ", userId, " offline");
      userOnline.delete(userId);
    });

    socket.on("check_online", (userId) => {
      let isOnline = userOnline.has(userId);
      socket.emit("online_status", isOnline);
    });

    socket.on("join_room", ({ conversationId, userId }) => {
      socket.join(conversationId);
      console.log("joined room: ", conversationId, "with user: ", userId);
    });

    socket.on("leave_room", ({ conversationId, userId }) => {
      socket.leave(conversationId);
      console.log("leaved room: ", conversationId, "with user: ", userId);
    });

    // Message
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

    // Typing event
    socket.on("typing", async ({ conversationId, userId }) => {
      const user = await User.findById(userId).select("fullName");
      console.log("User ", user.fullName, " is typing");
      if (userOnline.has(userId)) {
        io.to(conversationId).emit("typing", user.fullName);
      }
    });

    // Friend
    socket.on("send_request_friend", async ({ senderId, receiverId }) => {
      try {
        let user = await User.findById(senderId);
        let friend = await User.findById(receiverId);
        if (user && friend) {
          user.sendedRequestList.push(receiverId);
          await user.save();
          friend.receivedRequestList.push(senderId);
          await friend.save();

          const newUser = await User.findById(senderId)
            .select(
              "-password -passwordResetToken -passwordResetExpires -createdAt -updatedAt"
            )
            .populate({
              path: "friendList",
              model: "User",
              select: "fullName avatarUrl",
            })
            .populate({
              path: "sendedRequestList",
              model: "User",
              select: "fullName avatarUrl",
            })
            .populate({
              path: "receivedRequestList",
              model: "User",
              select: "fullName avatarUrl",
            });

          const newFriend = await User.findById(receiverId)
            .select(
              "-password -passwordResetToken -passwordResetExpires -createdAt -updatedAt"
            )
            .populate({
              path: "friendList",
              model: "User",
              select: "fullName avatarUrl",
            })
            .populate({
              path: "sendedRequestList",
              model: "User",
              select: "fullName avatarUrl",
            })
            .populate({
              path: "receivedRequestList",
              model: "User",
              select: "fullName avatarUrl",
            });

          if (userOnline.has(receiverId)) {
            io.emit(receiverId, {
              code: "receive_request_friend",
              sender: newUser.fullName,
              data: newFriend,
            });
          }

          console.log("userOnline: ", userOnline.keys());

          io.to(socket.id).emit("send_request_friend", {
            status: "success",
            data: newUser,
          });
        } else {
          io.to(socket.id).emit("send_request_friend", {
            status: "fail",
            message: "User or Friend is not found",
          });
        }
      } catch (error) {
        console.error("Error: ", error);
      }
    });

    socket.on("send_accept_friend", async ({ senderId, receiverId }) => {
      try {
        let user = await User.findById(senderId);
        let friend = await User.findById(receiverId);
        if (user && friend) {
          user.friendList.push(receiverId);
          friend.friendList.push(senderId);
          user.receivedRequestList = user.receivedRequestList.filter(
            (userId) => userId.toString() !== receiverId
          );
          friend.sendedRequestList = friend.sendedRequestList.filter(
            (userId) => userId.toString() !== senderId
          );
          await user.save();
          await friend.save();

          const newUser = await User.findById(senderId)
            .select(
              "-password -passwordResetToken -passwordResetExpires -createdAt -updatedAt"
            )
            .populate({
              path: "friendList",
              model: "User",
              select: "fullName avatarUrl",
            })
            .populate({
              path: "sendedRequestList",
              model: "User",
              select: "fullName avatarUrl",
            })
            .populate({
              path: "receivedRequestList",
              model: "User",
              select: "fullName avatarUrl",
            });

          const newFriend = await User.findById(receiverId)
            .select(
              "-password -passwordResetToken -passwordResetExpires -createdAt -updatedAt"
            )
            .populate({
              path: "friendList",
              model: "User",
              select: "fullName avatarUrl",
            })
            .populate({
              path: "sendedRequestList",
              model: "User",
              select: "fullName avatarUrl",
            })
            .populate({
              path: "receivedRequestList",
              model: "User",
              select: "fullName avatarUrl",
            });

          if (userOnline.has(receiverId)) {
            io.emit(receiverId, {
              code: "receive_accept_friend",
              sender: newUser.fullName,
              data: newFriend,
            });
          }

          io.to(socket.id).emit("send_accept_friend", {
            status: "success",
            data: newUser,
          });
        } else {
          io.to(socket.id).emit("send_accept_friend", {
            status: "fail",
            message: "User or Friend is not found",
          });
        }
      } catch (error) {
        console.error("Error: ", error);
      }
    });

    socket.on("send_delete_accept_friend", async ({ senderId, receiverId }) => {
      try {
        let user = await User.findById(senderId);
        let friend = await User.findById(receiverId);
        if (user && friend) {
          user.receivedRequestList = user.receivedRequestList.filter(
            (userId) => userId.toString() !== receiverId
          );
          friend.sendedRequestList = friend.sendedRequestList.filter(
            (userId) => userId.toString() !== senderId
          );
          await user.save();
          await friend.save();

          const newUser = await User.findById(senderId)
            .select(
              "-password -passwordResetToken -passwordResetExpires -createdAt -updatedAt"
            )
            .populate({
              path: "friendList",
              model: "User",
              select: "fullName avatarUrl",
            })
            .populate({
              path: "sendedRequestList",
              model: "User",
              select: "fullName avatarUrl",
            })
            .populate({
              path: "receivedRequestList",
              model: "User",
              select: "fullName avatarUrl",
            });

          const newFriend = await User.findById(receiverId)
            .select(
              "-password -passwordResetToken -passwordResetExpires -createdAt -updatedAt"
            )
            .populate({
              path: "friendList",
              model: "User",
              select: "fullName avatarUrl",
            })
            .populate({
              path: "sendedRequestList",
              model: "User",
              select: "fullName avatarUrl",
            })
            .populate({
              path: "receivedRequestList",
              model: "User",
              select: "fullName avatarUrl",
            });

          if (userOnline.has(receiverId)) {
            io.emit(receiverId, {
              code: "receive_delete_accept_friend",
              sender: newUser.fullName,
              data: newFriend,
            });
          }

          io.to(socket.id).emit("send_delete_accept_friend", {
            status: "success",
            data: newUser,
          });
        } else {
          io.to(socket.id).emit("send_delete_accept_friend", {
            status: "fail",
            message: "User or Friend is not found",
          });
        }
      } catch (error) {
        console.error("Error: ", error);
      }
    });

    socket.on("send_revoke_friend", async ({ senderId, receiverId }) => {
      try {
        let user = await User.findById(senderId);
        let friend = await User.findById(receiverId);
        if (user && friend) {
          user.sendedRequestList = user.sendedRequestList.filter(
            (userId) => userId.toString() !== receiverId
          );
          friend.receivedRequestList = friend.receivedRequestList.filter(
            (userId) => userId.toString() !== senderId
          );
          await user.save();
          await friend.save();

          const newUser = await User.findById(senderId)
            .select(
              "-password -passwordResetToken -passwordResetExpires -createdAt -updatedAt"
            )
            .populate({
              path: "friendList",
              model: "User",
              select: "fullName avatarUrl",
            })
            .populate({
              path: "sendedRequestList",
              model: "User",
              select: "fullName avatarUrl",
            })
            .populate({
              path: "receivedRequestList",
              model: "User",
              select: "fullName avatarUrl",
            });

          const newFriend = await User.findById(receiverId)
            .select(
              "-password -passwordResetToken -passwordResetExpires -createdAt -updatedAt"
            )
            .populate({
              path: "friendList",
              model: "User",
              select: "fullName avatarUrl",
            })
            .populate({
              path: "sendedRequestList",
              model: "User",
              select: "fullName avatarUrl",
            })
            .populate({
              path: "receivedRequestList",
              model: "User",
              select: "fullName avatarUrl",
            });

          if (userOnline.has(receiverId)) {
            io.emit(receiverId, {
              code: "receive_revoke_friend",
              sender: newUser.fullName,
              data: newFriend,
            });
          }

          io.to(socket.id).emit("send_revoke_friend", {
            status: "success",
            data: newUser,
          });
        } else {
          io.to(socket.id).emit("send_revoke_friend", {
            status: "fail",
            message: "User or Friend is not found",
          });
        }
      } catch (error) {
        console.error("Error: ", error);
      }
    });

    socket.on("send_delete_friend", async ({ senderId, receiverId }) => {
      try {
        let user = await User.findById(senderId);
        let friend = await User.findById(receiverId);
        if (user && friend) {
          user.friendList = user.friendList.filter(
            (userId) => userId.toString() !== receiverId
          );
          friend.friendList = friend.friendList.filter(
            (userId) => userId.toString() !== senderId
          );
          await user.save();
          await friend.save();

          const newUser = await User.findById(senderId)
            .select(
              "-password -passwordResetToken -passwordResetExpires -createdAt -updatedAt"
            )
            .populate({
              path: "friendList",
              model: "User",
              select: "fullName avatarUrl",
            })
            .populate({
              path: "sendedRequestList",
              model: "User",
              select: "fullName avatarUrl",
            })
            .populate({
              path: "receivedRequestList",
              model: "User",
              select: "fullName avatarUrl",
            });

          const newFriend = await User.findById(receiverId)
            .select(
              "-password -passwordResetToken -passwordResetExpires -createdAt -updatedAt"
            )
            .populate({
              path: "friendList",
              model: "User",
              select: "fullName avatarUrl",
            })
            .populate({
              path: "sendedRequestList",
              model: "User",
              select: "fullName avatarUrl",
            })
            .populate({
              path: "receivedRequestList",
              model: "User",
              select: "fullName avatarUrl",
            });

          if (userOnline.has(receiverId)) {
            io.emit(receiverId, {
              code: "receive_delete_friend",
              sender: newUser.fullName,
              data: newFriend,
            });
          }

          io.to(socket.id).emit("send_delete_friend", {
            status: "success",
            data: newUser,
          });
        } else {
          io.to(socket.id).emit("send_delete_friend", {
            status: "fail",
            message: "User or Friend is not found",
          });
        }
      } catch (error) {
        console.error("Error: ", error);
      }
    });

    // Conversation
    socket.on("send_create_conversation", async (conver) => {
      try {
        const conversation = await Conversation.create(conver);

        if (conversation) {
          await conversation.save();

          const newConversation = await Conversation.findById(
            conversation.id
          ).populate({
            path: "members",
            model: "User",
            select: "fullName avatarUrl",
          });

          const userAdmin = newConversation.members.find(
            (mem) => mem.id.toString() === newConversation.admin.toString()
          );
          // send notification to other members in conversation
          newConversation.members.forEach((member) => {
            if (member.id.toString() === newConversation.admin.toString())
              return;
            if (userOnline.has(member.id.toString())) {
              io.emit(member.id.toString(), {
                code: "receive_create_conversation",
                sender: userAdmin.fullName,
                data: newConversation,
              });
            }
          });

          io.to(socket.id).emit("send_create_conversation", {
            status: "success",
            data: newConversation,
          });
        }
      } catch (error) {
        console.error("Error: ", error);
      }
    });

    socket.on("send_create_group", async (conver) => {
      try {
        const conversation = await Conversation.create(conver);

        if (conversation) {
          await conversation.save();

          const newConversation = await Conversation.findById(
            conversation.id
          ).populate({
            path: "members",
            model: "User",
            select: "fullName avatarUrl",
          });

          const userAdmin = newConversation.members.find(
            (mem) => mem.id.toString() === newConversation.admin.toString()
          );
          // send notification to other members in conversation
          newConversation.members.forEach((member) => {
            if (member.id.toString() === newConversation.admin.toString())
              return;
            if (userOnline.has(member.id.toString())) {
              io.emit(member.id.toString(), {
                code: "receive_create_group",
                sender: userAdmin.fullName,
                name: newConversation.name,
                data: newConversation,
              });
            }
          });

          io.to(socket.id).emit("send_create_group", {
            status: "success",
            data: newConversation,
          });
        }
      } catch (error) {
        console.error("Error: ", error);
      }
    });

    socket.on("send_assign_admin", async ({ userId, conversationId }) => {
      try {
        const user = await User.findById(userId);
        let conversation = await Conversation.findById(conversationId);
        if (user && conversation) {
          if (!conversation.members.includes(userId)) {
            io.to(socket.id).emit("send_assign_admin", {
              status: "fail",
              message: "User isn't a member into this conversation",
            });
            return;
          }

          conversation.admin = userId;
          await conversation.save();

          // send notification to other members in conversation
          conversation.members.forEach((member) => {
            if (member.id.toString() === userId) return;
            if (userOnline.has(member.id.toString())) {
              io.emit(member.id.toString(), {
                code: "receive_assign_admin",
                name: conversation.name,
                member: user.fullName,
                data: { conversationId, userId },
              });
            }
          });

          io.to(socket.id).emit("send_assign_admin", {
            status: "success",
            data: { conversationId, userId },
          });
        } else {
          io.to(socket.id).emit("send_assign_admin", {
            status: "fail",
            message: "User or Conversation is not found",
          });
          return;
        }
      } catch (error) {
        console.error("Error: ", error);
      }
    });

    socket.on("send_remove_member", async ({ userId, conversationId }) => {
      try {
        const user = await User.findById(userId);
        let conversation = await Conversation.findById(conversationId);
        if (user && conversation) {
          if (!conversation.members.includes(userId)) {
            io.to(socket.id).emit("send_remove_member", {
              status: "fail",
              message: "User isn't a member into this conversation",
            });
            return;
          }

          conversation.members = conversation.members.filter(
            (memId) => memId.toString() !== userId
          );
          if (conversation.members.length === 1) {
            await Conversation.findByIdAndDelete(conversationId);
          } else {
            await conversation.save();
          }

          // send notification to other members in conversation
          conversation.members.forEach((member) => {
            if (member.id.toString() === conversation.admin.toString()) return;
            if (userOnline.has(member.id.toString())) {
              io.emit(member.id.toString(), {
                code: "receive_remove_member",
                name: conversation.name,
                member: user.fullName,
                data: { conversationId, userId },
              });
            }
          });

          io.to(socket.id).emit("send_remove_member", {
            status: "success",
            data: { conversationId, userId },
          });
        } else {
          io.to(socket.id).emit("send_remove_member", {
            status: "fail",
            message: "User or Conversation is not found",
          });
        }
      } catch (error) {
        console.error("Error: ", error);
      }
    });

    socket.on("send_remove_yourself", async ({ userId, conversationId }) => {
      try {
        let conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          io.to(socket.io).emit("send_remove_yourself", {
            status: "fail",
            message: "Conversation is not found",
          });
          return;
        }

        if (conversation.admin.toString() === userId) {
          io.to(socket.io).emit("send_remove_yourself", {
            status: "fail",
            message:
              "You should assign admin for other before removing this conversation!",
          });
          return;
        }

        const user = await User.findById(userId);

        conversation.members = conversation.members.filter(
          (memId) => memId.toString() !== userId
        );
        if (conversation.members.length === 1) {
          await Conversation.findByIdAndDelete(id);
        } else {
          await conversation.save();
        }

        // send notification to other members in conversation
        conversation.members.forEach((member) => {
          if (member.id.toString() === userId) return;
          if (userOnline.has(member.id.toString())) {
            io.emit(member.id.toString(), {
              code: "receive_remove_yourself",
              sender: user.fullName,
              name: conversation.name,
              data: { conversationId, userId },
            });
          }
        });

        io.to(socket.id).emit("send_remove_yourself", {
          status: "success",
          data: conversationId,
        });
      } catch (error) {
        console.error("Error: ", error);
      }
    });

    socket.on(
      "send_add_member",
      async ({ userId, conversationId, senderId }) => {
        try {
          const user = await User.findById(userId).populate(
            "fullName avatarUrl"
          );
          const conversation = await Conversation.findById(conversationId);

          if (conversation && user) {
            if (!conversation.members.includes(senderId)) {
              io.to(socket.id).emit("send_add_member", {
                status: "fail",
                message: "You aren't a member into this conversation",
              });
              return;
            }

            conversation.members.push(userId);
            await conversation.save();

            const senderName = await User.findById(senderId).select("fullName");

            // send notification to other members in conversation
            conversation.members.forEach((member) => {
              if (member.id.toString() === senderId) return;
              if (userOnline.has(member.id.toString())) {
                io.emit(member.id.toString(), {
                  code: "receive_add_member",
                  sender: senderName,
                  name: conversation.name,
                  member: user.fullName,
                  data: { conversationId, user },
                });
              }
            });

            io.to(socket.id).emit("send_add_member", {
              status: "success",
              data: { conversationId, user },
            });
          } else {
            io.to(socket.id).emit("send_add_member", {
              status: "fail",
              message: "User or Conversation is not found!",
            });
          }
        } catch (error) {
          console.log("Error: ", error);
        }
      }
    );

    socket.on(
      "send_delete_conversation",
      async ({ conversationId, userId }) => {
        try {
          const conversation = await Conversation.findById(
            conversationId
          ).populate({
            path: "members",
            model: "User",
            select: "fullName",
          });

          const user = conversation.members.find(
            (mem) => mem.id.toString() === userId
          );

          // send notification to other members in conversation
          conversation.members.forEach((member) => {
            if (member.id.toString() === userId) return;
            if (userOnline.has(member.id.toString())) {
              io.emit(member.id.toString(), {
                code: "receive_delete_conversation",
                sender: user.fullName,
                data: conversationId,
              });
            }
          });

          await Message.deleteMany({ conversationId });
          await Conversation.findByIdAndDelete(conversationId);

          io.to(socket.id).emit("send_delete_conversation", {
            status: "success",
            data: conversationId,
          });
        } catch (error) {
          console.error("Error: ", error);
        }
      }
    );

    socket.on("send_delete_group", async (conversationId) => {
      try {
        const conversation = await Conversation.findById(conversationId)
          .populate({
            path: "admin",
            model: "User",
            select: "fullName",
          })
          .populate({
            path: "members",
            model: "User",
            select: "fullName",
          });

        // send notification to other members in conversation
        conversation.members.forEach((member) => {
          if (member.id.toString() === conversation.admin.id.toString()) return;
          if (userOnline.has(member.id.toString())) {
            io.emit(member.id.toString(), {
              code: "receive_delete_group",
              sender: conversation.admin.fullName,
              name: conversation.name,
              data: conversationId,
            });
          }
        });

        await Message.deleteMany({ conversationId });
        await Conversation.findByIdAndDelete(conversationId);

        io.to(socket.id).emit("send_delete_group", {
          status: "success",
          data: conversationId,
        });
      } catch (error) {
        console.error("Error: ", error);
      }
    });

    socket.on("disconnect", () => {
      console.log("A user is disconnected");
    });
  });
};

module.exports = socket;
