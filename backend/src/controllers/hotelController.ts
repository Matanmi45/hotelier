import { Request, Response, NextFunction } from "express";
import { HydratedDocument } from "mongoose";

import { ApiFeatures } from "../utilities/features";
import { Hotel, IHotel } from "../models/hotel";
import { AppError } from "../utilities/appError";
import { catchAsync } from "../utilities/catchAsync";
import * as factory from "./handlerFactory";

// --------------------
// Extend Request
// --------------------
interface AuthRequest extends Request {
  user?: {
    email: string;
    role?: string;
  };
}

// --------------------
// Get All Hotels
// --------------------
export const getAll = catchAsync(
  async (req: Request, res: Response) => {
    const features = new ApiFeatures<IHotel>(
      Hotel.find(),
      req.query
    );

    const total = await Hotel.countDocuments();

    const query = features
      .filter()
      .sort()
      .limitFields()
      .paginate()
      .getQuery();

    const hotels = await query;

    res.status(200).json({
      status: "success",
      count: total,
      data: { hotels }
    });
  }
);

// --------------------
// Create Hotel
// --------------------
export const create = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const hotel = await Hotel.create({
      ...req.body,
      createdBy: req.user?.email
    });

    res.status(201).json({
      status: "success",
      data: { hotel }
    });
  }
);

// --------------------
// Get Hotel By ID
// --------------------
export const getById = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const hotel = await Hotel.findById(req.params.id)
      .populate({
        path: "rooms",
        select: "-__v"
      })
      .populate("reviews");

    if (!hotel) {
      return next(
        new AppError(
          "The hotel with given ID is not found.",
          404
        )
      );
    }

    res.status(200).json({
      status: "success",
      data: { hotel }
    });
  }
);

// --------------------
// Update & Delete
// --------------------
export const update = factory.updateOne<IHotel>(Hotel, "hotel");
export const deleteHotel = factory.deleteOne<IHotel>(
  Hotel,
  "hotel"
);

// --------------------
// Featured Hotels
// --------------------
export const getFeaturedHotels = catchAsync(
  async (req: Request, res: Response) => {
    const featuredHotels = await Hotel.aggregate([
      { $match: { featured: true } },
      { $sort: { avgRating: -1 } },
      { $limit: 5 }
    ]);

    res.status(200).json({
      status: "success",
      data: { featured: featuredHotels }
    });
  }
);

// --------------------
// Hotels by City
// --------------------
export const getHotelsByCity = catchAsync(
  async (req: Request, res: Response) => {
    const hotelsByCity = await Hotel.aggregate([
      {
        $group: {
          _id: "$city",
          count: { $sum: 1 },
          cheapestPrice: { $min: "$cheapestPrice" }
        }
      },
      {
        $addFields: {
          city: "$_id",
          image: {
            $concat: [
              "/images/city/",
              { $toLower: "$_id" },
              ".jpg"
            ]
          }
        }
      },
      { $project: { _id: 0 } },
      { $sort: { count: -1 } },
      { $limit: 3 }
    ]);

    res.status(200).json({
      status: "success",
      data: { hotels: hotelsByCity }
    });
  }
);

// --------------------
// Hotels by Type
// --------------------
export const getHotelsByType = catchAsync(
  async (req: Request, res: Response) => {
    const hotelsByType = await Hotel.aggregate([
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 }
        }
      },
      {
        $addFields: {
          type: "$_id",
          image: {
            $concat: [
              "/images/type/",
              { $toLower: "$_id" },
              ".jpg"
            ]
          }
        }
      },
      { $project: { _id: 0 } },
      { $sort: { count: -1 } },
      { $limit: 4 }
    ]);

    res.status(200).json({
      status: "success",
      data: { hotels: hotelsByType }
    });
  }
);