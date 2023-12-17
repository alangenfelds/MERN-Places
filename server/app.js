require("dotenv").config();

const fs = require("fs");
const path = require("path");

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const placesRoutes = require("./routes/places-routes");
const usersRoutes = require("./routes/users-routes");
const HttpError = require("./models/http-error");

const app = express();

app.use(bodyParser.json());

app.use("/uploads/images", express.static(path.join("uploads", "images")));

app.use((req, res, next) => {
  // add headers to prevent CORS error
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, PATCH, DELETE");

  next();
});

app.use("/api/places", placesRoutes);
app.use("/api/users", usersRoutes);

// catch all handler
app.use((req, res, next) => {
  const error = new HttpError("Path not found", 404);
  throw error;
});

// if we provide 4 parameters, express will treat it as error handling middleware - this function will work if any middleware above yields an error
app.use((error, req, res, next) => {
  // delete uploaded file in case of error
  if (req.file) {
    fs.unlink(req.file.path, (err) => {
      if (err) {
        console.log("file deletion failed: ", err);
      }
    });
  }
  if (res.headerSent) {
    return next(error);
  }

  res.status(error.code || 500);
  res.json({ message: error.message || "An unknown error occured." });
});

mongoose
  .connect(
    `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.dxm0eov.mongodb.net/?retryWrites=true&w=majority`
  )
  .then(() => {
    app.listen(5000);
  })
  .catch((error) => {
    console.log("process.env.MONGO_USER", process.env.MONGO_USER);
    console.log("Error: ", error);
  });
