require("dotenv").config();
const jwt = require("jsonwebtoken");

const HttpError = require("../models/http-error");

module.exports = (req, res, next) => {
  if (req.method === "OPTIONS") {
    return next();
  }
  try {
    // Authorization: 'Bearer TOKEN'
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      throw new Error("Authentication failed");
    }

    const decodedToken = jwt.verify(token, process.env.JWT_PRIVATE_KEY);
    req.userData = { userId: decodedToken.userId };
    next();
  } catch (err) {
    const error = new HttpError(
      "Authentication failed, please try again later!",
      403
    );
    return next(error);
  }
};
