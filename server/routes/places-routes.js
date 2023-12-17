const express = require("express");
const { check } = require("express-validator");

const fileUploadMiddleware = require("../middleware/file-upload");
const authCheck = require("../middleware/check-auth");
const placesController = require("../controllers/places-controller");

const router = express.Router();

router.get("/:placeId", placesController.getPlaceById);

router.get("/user/:userId", placesController.getUserPlaces);

router.use(authCheck);

router.post(
  "/",
  fileUploadMiddleware.single("image"),
  [
    check("title").not().isEmpty(),
    check("description").isLength({ min: 5 }),
    check("address").not().isEmpty(),
  ],
  placesController.createPlace
);

router.patch(
  "/:placeId",
  [check("title").not().isEmpty(), check("description").isLength({ min: 5 })],
  placesController.updatePlace
);

router.delete("/:placeId", placesController.deletePlace);

module.exports = router;
