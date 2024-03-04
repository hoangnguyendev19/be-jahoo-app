const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const dotenv = require("dotenv");
const connectDB = require("./configs/connectDB");
const bodyParser = require("body-parser");

const userRoutes = require("./routes/userRoutes");
const messageRoutes = require("./routes/messageRoutes");
const conversationRoutes = require("./routes/conversationRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const socket = require("./socket");

dotenv.config();
const PORT = process.env.PORT || 5001;

const app = express();
connectDB();

app.use(cors({ origin: "*", allowedHeaders: "*" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: false }));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Router
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/messages", messageRoutes);
app.use("/api/v1/conversations", conversationRoutes);
app.use("/api/v1/uploads", uploadRoutes);

socket(io);

server.listen(PORT, () => {
  console.log(`Server is running on PORT ${PORT}`);
});
