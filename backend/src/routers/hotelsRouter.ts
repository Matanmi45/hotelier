import express from "express";

import * as hotelController from "../controllers/hotelController";
import * as authController from "../controllers/authController";

import roomsRouter from "../routers/roomsRouter";
import reviewRouter from "../routers/reviewRouter";

// --------------------
// Router
// --------------------
const hotelRouter = express.Router();

// --------------------
// Nested Routes
// --------------------
hotelRouter.use("/:hotelId/rooms", roomsRouter);
hotelRouter.use("/:hotelId/reviews", reviewRouter);

// --------------------
// Special Routes
// --------------------
hotelRouter.get(
  "/get-featured",
  hotelController.getFeaturedHotels
);

hotelRouter.get(
  "/get-hotels-by-city",
  hotelController.getHotelsByCity
);

hotelRouter.get(
  "/get-hotels-by-type",
  hotelController.getHotelsByType
);

// --------------------
// CRUD Routes
// --------------------
hotelRouter
  .route("/")
  .get(hotelController.getAll)
  .post(
    authController.isAuthenticated,
    authController.isAuthorized("admin", "super"),
    hotelController.create
  );

hotelRouter
  .route("/:id")
  .get(hotelController.getById)
  .patch(
    authController.isAuthenticated,
    authController.isAuthorized("admin"),
    hotelController.update
  )
  .delete(
    authController.isAuthenticated,
    authController.isAuthorized("admin", "super"),
    hotelController.deleteHotel
  );

// --------------------
// Export
// --------------------
export default hotelRouter;