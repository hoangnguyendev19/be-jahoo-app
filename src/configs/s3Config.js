const AWS = require("aws-sdk");
const multer = require("multer");
const dotenv = require("dotenv");
dotenv.config();

const s3 = new AWS.S3({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const uploadS3 = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === "application/pdf" ||
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
      file.mimetype === "application/zip" ||
      file.mimetype === "application/x-zip-compressed" ||
      file.mimetype === "application/vnd.ms-excel" ||
      file.mimetype === "application/x-rar-compressed"
    ) {
      return cb(null, true);
    }
    return cb(new Error("Invalid file type"));
  },
});

module.exports = { uploadS3, s3 };
