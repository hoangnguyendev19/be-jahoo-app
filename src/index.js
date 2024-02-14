const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const dotenv = require("dotenv");
const connectDB = require("./config/connectDB");
const bodyParser = require("body-parser");

const userRoutes = require("./routes/userRoutes");
const messageRoutes = require("./routes/messageRoutes");
const conversationRoutes = require("./routes/conversationRoutes");

dotenv.config();
const PORT = process.env.PORT || 5001;

const app = express();
connectDB();

app.use(cors({ origin: "https://192.168.1.8:3000" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: false }));

// Router
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/messages", messageRoutes);
app.use("/api/v1/conversations", conversationRoutes);

const server = http.createServer(app);
const io = new Server(server);

// Socket.io connection
io.on("connection", (socket) => {
  console.log("User connected");

  // Listen for new messages
  socket.on("new_message", async (messageData) => {
    try {
      const message = new Message(messageData);
      await message.save();
      io.emit("new_message", message);
    } catch (error) {
      console.error(error);
    }
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on PORT ${PORT}`);
});
