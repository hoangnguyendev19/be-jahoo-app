const express = require("express");
const fileUploader = require("../configs/cloudinary");

const router = express.Router();

router.post("/upload-file", fileUploader.single("file"), (req, res, next) => {
  if (!req.file) {
    next(new Error("No file uploaded!"));
    return;
  }

  return res.json({ status: "success", data: req.file.path });
});

module.exports = router;
