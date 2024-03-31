const { s3 } = require("../configs/s3Config");
const dotenv = require("dotenv");
dotenv.config();

exports.uploadImage = (req, res, next) => {
  try {
    if (!req.file) {
      return res
        .status(422)
        .json({ status: "fail", message: "Please upload an image" });
    }

    console.log(req.file);

    return res.status(200).json({ status: "success", data: req.file.path });
  } catch (error) {
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

exports.uploadFile = (req, res, next) => {
  console.log(req.file);
  try {
    const image = req.file.originalname.split(".");
    const fileType = image[image.length - 1];
    const filePath = `${image}-${Date.now()}.${fileType}`;

    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: filePath,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    };

    s3.upload(params, (error, data) => {
      if (error) {
        return res.status(500).json({ status: "fail", message: error.message });
      }

      return res.status(200).json({ status: "success", data: data.Location });
    });
  } catch (error) {
    return res.status(500).json({ status: "fail", message: error.message });
  }
};
