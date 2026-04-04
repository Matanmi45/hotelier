import express from "express";

import * as userController from "../controllers/userController";
import * as authController from "../controllers/authController";

// --------------------
// Router
// --------------------
const usersRouter = express.Router();

// --------------------
// Routes
// --------------------
usersRouter.patch(
  "/updatePassword",
  authController.isAuthenticated,
  userController.updatePassword
);

usersRouter.patch(
  "/updateMe",
  authController.isAuthenticated,
  userController.uploadImage,
  userController.resizeImage,
  userController.updateMe
);

usersRouter.delete(
  "/deleteMe",
  authController.isAuthenticated,
  userController.deleteMe
);

usersRouter.get(
  "/me",
  authController.isAuthenticated,
  userController.getDetails
);

// --------------------
// Export
// --------------------
export default usersRouter;