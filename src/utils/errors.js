exports.sendError = (res, error) => {
  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    success: false,
    status: 500,
    message: error.message,
  });
};

exports.sendWarning = (res, msg) => {
  res.status(HTTP_STATUS.BAD_REQUEST).json({
    success: false,
    status: 400,
    message: msg,
  });
};

exports.sendUnauthenticated = (res) => {
  res.status(HTTP_STATUS.UNAUTHENTICATED).json({
    success: false,
    status: 401,
    msg: "Unauthenticated",
  });
};

exports.sendNotFound = (res, msg) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    status: 404,
    message: msg,
  });
};

exports.sendConflict = (res, msg) => {
  res.status(HTTP_STATUS.CONFLICT).json({
    success: false,
    status: 409,
    message: msg,
  });
};
