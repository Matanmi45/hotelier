import express from "express";
import * as authController from "../controllers/authController";

// --------------------
// Router
// --------------------
const authRouter = express.Router();

// --------------------
// Routes
// --------------------
authRouter.post("/signup", authController.signup);
authRouter.post("/login", authController.login);
authRouter.post("/logout", authController.logout);

authRouter.post(
  "/forgotPassword",
  authController.forgotPassword
);

authRouter.patch(
  "/resetPassword/:token",
  authController.resetPassword
);

// --------------------
// Export
// --------------------
export default authRouter;