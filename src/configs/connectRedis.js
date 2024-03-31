const redis = require("redis");
const dotenv = require("dotenv");
dotenv.config();

const client = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  // username: process.env.REDIS_USERNAME,
  // password: process.env.REDIS_PASSWORD,
});

client.on("error", (error) => {
  console.error(error);
});

client.on("connect", () => {
  console.log("🚀> Redis connected");
});

client.connect((error) => {
  if (error) {
    console.error(error);
  }
});

module.exports = client;
