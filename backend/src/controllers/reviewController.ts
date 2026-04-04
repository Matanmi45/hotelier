import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";

import { Review, IReview } from "../models/review";
import { catchAsync } from "../utilities/catchAsync";
import * as factory from "./handlerFactory";

// --------------------
// Extend Request
// --------------------
interface AuthRequest extends Request {
  user?: {
    _id: Types.ObjectId;
  };
  params: {
    hotelId?: string;
    id?: string;
  };
  body: {
    ratings: number;
    comment: string;
  };
}

// --------------------
// Create Review
// --------------------
export const create = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const reviewData: Partial<IReview> = {
      ratings: req.body.ratings,
      comment: req.body.comment,
      user: req.user!._id,
      hotel: new Types.ObjectId(req.params.hotelId)
    };

    const newReview = await Review.create(reviewData);

    res.status(201).json({
      status: "success",
      data: { review: newReview }
    });
  }
);

// --------------------
// Get All Reviews
// --------------------
export const getAll = catchAsync(
  async (req: Request, res: Response) => {
    const reviews = await Review.find();

    res.status(200).json({
      status: "success",
      count: reviews.length,
      data: { reviews }
    });
  }
);

// --------------------
// Delete Review
// --------------------
export const deleteReview = factory.deleteOne<IReview>(
  Review,
  "review"
);

// --------------------
// Update Review
// --------------------
export const updateReview = factory.updateOne<IReview>(
  Review,
  "review"
);