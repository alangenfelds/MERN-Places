const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const fs = require("fs");

const HttpError = require("../models/http-error");
const getCoordsForAddress = require("../util/location");
const Place = require("../models/place");
const User = require("../models/user");

const getPlaceById = async (req, res, next) => {
  const placeId = req.params.placeId;

  let place;

  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError("Error getting a place by id", 500);
    return next(error);
  }

  if (!place) {
    const error = new HttpError(
      "Cound not find a place for the provided id",
      404
    );

    return next(error);
  }

  res.json({ place: place.toObject({ getters: true }) });
};

const getUserPlaces = async (req, res, next) => {
  const userId = req.params.userId;

  let userWithPlaces;

  try {
    userWithPlaces = await User.findById(userId).populate("places");
  } catch (err) {
    const error = new HttpError("Error getting a place by user id", 500);
    return next(error);
  }

  if (!userWithPlaces || userWithPlaces.places.length === 0) {
    const error = new HttpError(
      "Cound not find a places for the provided user id",
      404
    );

    return next(error);
  }

  res.json({
    places: userWithPlaces.places.map((p) => p.toObject({ getters: true })),
  });
};

const createPlace = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(new HttpError("Please enter valid data", 422));
  }

  const { title, description, address, creator } = req.body; // already parsed to JSON thanks to bodyParser middleware

  let coordinates;

  try {
    coordinates = await getCoordsForAddress(address);
  } catch (error) {
    console.log("ERROR getting coordinates");
    return next(error);
  }

  const createdPlace = new Place({
    title,
    description,
    address,
    image: req.file.path,
    location: coordinates,
    creator,
  });

  let user;

  try {
    user = await User.findById(creator);
  } catch (err) {
    const error = new HttpError(
      "Creating place failed, please try again!",
      500
    );
    return next(error);
  }

  if (!user) {
    const error = new HttpError("Could not find user with provided id!", 404);
    return next(error);
  }

  try {
    // to create a set of actions need to create a session
    // if some step fails, it allows to undo every change
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdPlace.save({ session: sess });
    user.places.push(createdPlace);
    await user.save({ session: sess });
    await sess.commitTransaction(); // saving changes to db at this point
  } catch (err) {
    console.log("err", err);
    const error = new HttpError(
      "Creation of place failed, please try again!",
      500
    );

    return next(error);
  }

  res.status(201).json({ place: createdPlace });
};

const updatePlace = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(new HttpError("Please enter valid data", 422));
  }

  const { title, description } = req.body;
  const placeId = req.params.placeId;

  let place;

  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError("UPDATE - Error getting a place by id", 500);
    return next(error);
  }

  place.title = title;
  place.description = description;

  try {
    await place.save();
  } catch (err) {
    const error = new HttpError("Error updating place", 500);
    return next(error);
  }

  res.status(200).json({ place: place.toObject({ getters: true }) });
};

const deletePlace = async (req, res, next) => {
  const placeId = req.params.placeId;

  let place;

  try {
    place = await Place.findById(placeId).populate("creator");
  } catch (err) {
    const error = new HttpError("DELETE - Error getting a place by id", 500);
    return next(error);
  }

  if (!place) {
    const error = new HttpError("Could not find a place with this id", 404);
    return next(error);
  }

  const imagePath = place.image;

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await place.deleteOne({ session: sess });
    place.creator.places.pull(place);
    await place.creator.save({ session: sess });
    await sess.commitTransaction(); // saving changes to db at this point
  } catch (err) {
    console.log("err", err);
    const error = new HttpError("Error deleting a place", 500);
    return next(error);
  }

  fs.unlink(imagePath, (err) => {
    console.log("Failed to delete image. ", err);
  });

  res.status(200).json({ message: "Place is deleted" });
};

exports.getPlaceById = getPlaceById;
exports.getUserPlaces = getUserPlaces;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
