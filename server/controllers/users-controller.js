require("dotenv").config();

const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const HttpError = require("../models/http-error");
const User = require("../models/user");

const getUsers = async (req, res, next) => {
  let users;

  try {
    users = await User.find({}, "-password");
  } catch (err) {}

  res
    .status(200)
    .json({ users: users.map((u) => u.toObject({ getters: true })) });
};

const signup = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(new HttpError("Please enter valid data", 422));
  }

  const { name, email, password } = req.body;

  let existingUser;

  try {
    existingUser = await User.findOne({ email });
  } catch (err) {
    const error = new HttpError(
      "Signing up failed, please try again later!",
      500
    );
    return next(error);
  }

  if (existingUser) {
    const error = new HttpError(
      "User already exists. Please login instead",
      422
    );
    return next(error);
  }

  let hashedPassword;

  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    const error = new HttpError(
      "Failed to create user. Please try again!",
      500
    );
    return next(error);
  }

  const newUser = new User({
    name,
    email,
    image: req.file.path,
    password: hashedPassword,
    places: [],
  });

  try {
    await newUser.save();
  } catch (err) {
    console.log("err", err);
    const error = new HttpError("Signing up failed!", 500);
    return next(error);
  }

  let token;

  try {
    token = jwt.sign(
      {
        userId: newUser.id,
        email: newUser.email,
      },
      process.env.JWT_PRIVATE_KEY,
      { expiresIn: "1h" }
    );
  } catch (err) {
    const error = new HttpError("Signing up failed!", 500);
    return next(error);
  }

  res.status(201).json({
    message: "User created successfully",
    userId: newUser.id,
    email: newUser.email,
    token,
  });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;

  try {
    existingUser = await User.findOne({ email });
  } catch (err) {
    const error = new HttpError(
      "Logging in failed, please try again later!",
      500
    );
    return next(error);
  }

  if (!existingUser) {
    return next(new HttpError("User not found or credentials are wrong", 403));
  }

  let isValidPassword = false;

  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    const error = new HttpError(
      "Logging in failed, please try again later!",
      500
    );
    return next(error);
  }

  if (!isValidPassword) {
    return next(new HttpError("User not found or credentials are wrong", 401));
  }

  let token;

  try {
    token = jwt.sign(
      {
        userId: existingUser.id,
        email: existingUser.email,
      },
      process.env.JWT_PRIVATE_KEY,
      { expiresIn: "1h" }
    );
  } catch (err) {
    const error = new HttpError("Logging in failed!", 500);
    return next(error);
  }

  res.status(200).json({
    message: "Logged in succesfully!",
    // user: existingUser.toObject({
    //   getters: true,
    //   transform: (doc, ret) => {
    //     delete ret.password;
    //     return ret;
    //   },
    // }),
    userId: existingUser.id,
    email: existingUser.email,
    token,
  });
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
