import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import multer from "multer";
import sharp from "sharp";

import { AppError } from "../utilities/appError";
import { catchAsync } from "../utilities/catchAsync";
import { User } from "../models/user";
import { signToken } from "../utilities/signToken";

// --------------------
// Extend Request
// --------------------
interface AuthRequest extends Request {
  user?: any;
  files?: any;
  photo?: string;
  cover?: string;
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
// Multer Setup
// --------------------
const storage = multer.memoryStorage();

const fileFilter: multer.Options["fileFilter"] = (
  req,
  file,
  cb
) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        "Not an image. Please upload only image file",
        400
      ) as any,
      false
    );
  }
};

const upload = multer({ storage, fileFilter });

// --------------------
// Upload Middleware
// --------------------
export const uploadImage = upload.fields([
  { name: "photo", maxCount: 1 },
  { name: "cover", maxCount: 1 }
]);

// --------------------
// Resize Image
// --------------------
export const resizeImage = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.files) return next();

    if (req.files.photo) {
      req.photo = `user-${req.user._id}.jpeg`;

      await sharp(req.files.photo[0].buffer)
        .resize(512, 512)
        .toFormat("jpeg")
        .jpeg({ quality: 90 })
        .toFile(`public/images/users/profile/${req.photo}`);
    }

    if (req.files.cover) {
      req.cover = `cover-${req.user._id}.jpeg`;

      await sharp(req.files.cover[0].buffer)
        .resize(2000, 1300)
        .toFormat("jpeg")
        .jpeg({ quality: 90 })
        .toFile(`public/images/users/cover/${req.cover}`);
    }

    next();
  }
);

// --------------------
// Update Password
// --------------------
export const updatePassword = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = await User.findById(req.user._id).select(
      "+password"
    );

    if (!user) {
      return next(new AppError("Cannot find the user.", 404));
    }

    const isMatch = await user.comparePassword(
      req.body.currentPassword
    );

    if (!isMatch) {
      return next(
        new AppError("The provided password is wrong.", 401)
      );
    }

    user.password = req.body.newPassword;
    user.passwordChangedAt = new Date();

    await user.save();

    const token = signToken(user._id);

    res.cookie("access_token", token, cookieOptions);

    res.status(200).json({
      status: "success",
      data: { user }
    });
  }
);

// --------------------
// Update Me
// --------------------
export const updateMe = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.body.password || req.body.confirmPassword) {
      return next(
        new AppError(
          "Use Update Password to change your password.",
          400
        )
      );
    }

    const updatedData = {
      firstname: req.body.firstname || req.user.firstname,
      lastname: req.body.lastname || req.user.lastname,
      bio: req.body.bio || req.user.bio,
      photo: req.photo || req.user.photo,
      coverPhoto: req.cover || req.user.coverPhoto,
      address: {
        city: req.body.address?.city || req.user.address?.city,
        country:
          req.body.address?.country || req.user.address?.country
      },
      contact: {
        altEmail:
          req.body.contact?.altEmail ||
          req.user.contact?.altEmail,
        code: req.body.contact?.code || req.user.contact?.code,
        phone:
          req.body.contact?.phone ||
          req.user.contact?.phone
      }
    };

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updatedData,
      { runValidators: true, new: true }
    );

    res.status(200).json({
      status: "success",
      data: { user: updatedUser }
    });
  }
);

// --------------------
// Delete Me
// --------------------
export const deleteMe = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = await User.findByIdAndUpdate(req.user._id, {
      isActive: false
    });

    if (!user) {
      return next(
        new AppError("Cannot find the user to delete.", 404)
      );
    }

    res.status(204).json({
      status: "success",
      data: null
    });
  }
);

// --------------------
// Get My Details
// --------------------
export const getDetails = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const user = await User.findById(req.user._id);

    res.status(200).json({
      status: "success",
      data: { user }
    });
  }
);