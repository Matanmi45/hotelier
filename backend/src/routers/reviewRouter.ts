import express from "express";

import * as reviewController from "../controllers/reviewController";
import * as authController from "../controllers/authController";

// --------------------
// Router
// --------------------
const reviewRouter = express.Router({ mergeParams: true });

// --------------------
// Routes
// --------------------
reviewRouter
  .route("/")
  .post(
    authController.isAuthenticated,
    authController.isAuthorized("user"),
    reviewController.create
  )
  .get(reviewController.getAll);

reviewRouter
  .route("/:id")
  .delete(
    authController.isAuthenticated,
    authController.isAuthorized("user"),
    reviewController.deleteReview
  )
  .patch(
    authController.isAuthenticated,
    authController.isAuthorized("user"),
    reviewController.updateReview
  );

// --------------------
// Export
// --------------------
export default reviewRouter;