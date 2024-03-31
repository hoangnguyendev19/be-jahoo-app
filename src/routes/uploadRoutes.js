const express = require("express");
const { uploadImage, uploadFile } = require("../controllers/uploadController");
const { uploadS3 } = require("../configs/s3Config");
const uploadCloud = require("../configs/cloudinary");
const router = express.Router();

router.post("/image", uploadCloud.single("image"), uploadImage);

router.post("/file", uploadS3.single("file"), uploadFile);

module.exports = router;
