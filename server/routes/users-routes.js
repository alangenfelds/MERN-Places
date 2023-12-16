const express = require("express");
const { check } = require("express-validator");

const usersController = require("../controllers/users-controller");
const fileUploadMiddleware = require("../middleware/file-upload");

const router = express.Router();

router.get("/", usersController.getUsers);

router.post(
  "/signup",
  fileUploadMiddleware.single("image"),
  [
    check("name").not().isEmpty(),
    check("email").normalizeEmail().isEmail(),
    check("password").not().isEmpty(),
  ],
  usersController.signup
);

router.post("/login", usersController.login);

module.exports = router;
