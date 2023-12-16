const HttpError = require("../models/http-error");
const { validationResult } = require("express-validator");

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

  const newUser = new User({
    name,
    email,
    image: req.file.path,
    password,
    places: [],
  });

  try {
    await newUser.save();
  } catch (err) {
    console.log("err", err);
    const error = new HttpError("Signing up failed!", 500);
    return next(error);
  }

  res.status(201).json({ message: "User created successfully" });
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

  if (!existingUser || existingUser.password !== password) {
    return next(new HttpError("User not found or credentials are wrong", 401));
  }

  res.status(200).json({
    message: "Logged in succesfully!",
    user: existingUser.toObject({
      getters: true,
      transform: (doc, ret) => {
        delete ret.password;
        return ret;
      },
    }),
  });
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
