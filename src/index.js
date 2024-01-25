import express from "express";
import cors from "cors";
import http from "http";
import dotenv from "dotenv";
import connectDB from "./config/connectDB.js";

dotenv.config();
const PORT = process.env.PORT || 5001;

const app = express();
connectDB();

app.use(cors());
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.json({ limit: "50mb" }));

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Server is running on PORT ${PORT}`);
});
