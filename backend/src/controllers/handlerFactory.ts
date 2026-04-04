import { Request, Response, NextFunction } from "express";
import { Model, Types } from "mongoose";

import { catchAsync } from "../utilities/catchAsync";
import { AppError } from "../utilities/appError";

export const toObjectId = (id: string) =>
  new Types.ObjectId(id);

// --------------------
// Generic Delete
// --------------------
export const deleteOne =
  <T>(Model: Model<T>, name: string) =>
  catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const doc = await Model.findByIdAndDelete(req.params.id);

      if (!doc) {
        return next(
          new AppError(
            `The ${name} with given ID is not found.`,
            404
          )
        );
      }

      res.status(204).json({
        status: "success"
      });
    }
  );

// --------------------
// Extend Model for optional static
// --------------------
type ModelWithCheapest<T> = Model<T> & {
  calcCheapestPrice?: (
    hotelId: Types.ObjectId
  ) => Promise<void>;
};

// --------------------
// Generic Update
// --------------------
export const updateOne =
  <T>(Model: ModelWithCheapest<T>, name: string) =>
  catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const doc = await Model.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          new: true,
          runValidators: true
        }
      );

      if (!doc) {
        return next(
          new AppError(
            `The ${name} with given ID is not found.`,
            404
          )
        );
      }

      // Special logic for Room model
      if (Model.modelName === "Room") {
        const hotelId = Array.isArray(req.params.hotelId)
          ? req.params.hotelId[0]
          : req.params.hotelId;

        if (hotelId && Model.calcCheapestPrice) {
          await Model.calcCheapestPrice(toObjectId(hotelId));
        }
      }

      res.status(200).json({
        status: "success",
        data: {
          [name]: doc
        }
      });
    }
  );