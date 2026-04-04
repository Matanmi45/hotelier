import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { catchAsync } from "@/utilities/catchAsync";
import {AppError} from "@/utilities/appError";
import { sendEmail } from "@/utilities/email";
import {User} from "@/models/user";
import { signToken } from "@/utilities/signToken";





// --------------------
// Extend Request type
// --------------------
interface AuthRequest extends Request {
  user?: any;
}

// --------------------
// Cookie Options
// --------------------
const cookieOptions = {
  maxAge: 7 * 24 * 60 * 60 * 1000,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production"
};

// --------------------
// Signup
// --------------------
export const signup = catchAsync(
  async (req: Request, res: Response) => {
    const newUser = await User.create(req.body);

    const token = signToken(newUser._id);

    res.cookie("access_token", token, cookieOptions);

    res.status(201).json({
      status: "success",
      data: { user: newUser }
    });
  }
);

// --------------------
// Login
// --------------------
export const login = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    if (!email) {
      return next(new AppError("Email is not provided", 400));
    }

    if (!password) {
      return next(new AppError("Password is not provided", 400));
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return next(
        new AppError("User with given email is not found.", 400)
      );
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return next(new AppError("Password is not correct.", 401));
    }

    const token = signToken(user._id);

    res.cookie("access_token", token, cookieOptions);

    res.status(200).json({
      status: "success"
    });
  }
);

// --------------------
// Forgot Password
// --------------------
export const forgotPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return next(
        new AppError(
          "Cannot find the user with provided email.",
          404
        )
      );
    }

    const plainResetToken = user.generateResetToken();
    await user.save({ validateBeforeSave: false });

    const resetTokenLink = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/auth/resetPassword/${plainResetToken}`;

    const message = `We received a password reset request.\n\n${resetTokenLink}\n\nThis link is valid for 10 minutes.`;

    try {
      await sendEmail({
        email: user.email,
        subject: "Password Change Request",
        message
      });

      res.status(200).json({
        status: "success",
        message:
          "A password reset link has been sent to user email."
      });
    } catch (error) {
      user.resetToken = undefined;
      user.resetTokenExpiresAt = undefined;
      await user.save({ validateBeforeSave: false });

      return next(
        new AppError(
          "Error sending password reset email.",
          500
        )
      );
    }
  }
);

// --------------------
// Reset Password
// --------------------
export const resetPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const hashedToken = crypto
      .createHash("sha256")
      .update(Array.isArray(req.params.token) ? req.params.token[0] : req.params.token)
      .digest("hex");

    const user = await User.findOne({
      resetToken: hashedToken,
      resetTokenExpiresAt: { $gt: new Date() }
    });

    if (!user) {
      return next(
        new AppError(
          "Reset token is invalid or expired.",
          400
        )
      );
    }

    user.password = req.body.password;
    user.passwordChangedAt = new Date();

    user.resetToken = undefined;
    user.resetTokenExpiresAt = undefined;

    await user.save();

    const token = signToken(user._id);

    res.cookie("access_token", token, cookieOptions);

    res.status(200).json({
      status: "success"
    });
  }
);

// --------------------
// Logout
// --------------------
export const logout = catchAsync(
  async (req: Request, res: Response) => {
    res.cookie("access_token", "", { maxAge: 0 });

    res.status(200).json({
      status: "success"
    });
  }
);

// --------------------
// Auth Middleware
// --------------------
interface JwtPayload {
  userId: string;
  iat: number;
}

export const isAuthenticated = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = req.cookies?.access_token;

    if (!token) {
      return next(new AppError("You are not logged-in.", 401));
    }

    const decoded = jwt.verify(
      token,
      process.env.SECRET_KEY as string
    ) as JwtPayload;

    const user = await User.findById(decoded.userId);

    if (!user) {
      return next(
        new AppError("User does not exist.", 401)
      );
    }

    const changed = await user.isPasswordChanged(decoded.iat);

    if (changed) {
      return next(
        new AppError(
          "Password changed. Please login again.",
          401
        )
      );
    }

    req.user = user;
    next();
  }
);

// --------------------
// Authorization
// --------------------
export const isAuthorized =
  (...roles: string[]) =>
  (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new AppError(
          "You do not have permission to perform this action",
          403
        )
      );
    }

    next();
  };