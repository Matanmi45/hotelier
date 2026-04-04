import express from "express";

import * as roomController from "../controllers/roomController";
import * as authController from "../controllers/authController";

// --------------------
// Router
// --------------------
const roomsRouter = express.Router({ mergeParams: true });

// --------------------
// Routes
// --------------------
roomsRouter
  .route("/")
  .post(
    authController.isAuthenticated,
    authController.isAuthorized("admin"),
    roomController.create
  )
  .get(roomController.getAll);

roomsRouter
  .route("/:id")
  .delete(
    authController.isAuthenticated,
    authController.isAuthorized("admin"),
    roomController.deleteRoom
  )
  .get(roomController.getById)
  .patch(
    authController.isAuthenticated,
    authController.isAuthorized("admin"),
    roomController.updateRoom
  );

// --------------------
// Export
// --------------------
export default roomsRouter;