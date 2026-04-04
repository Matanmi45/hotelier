import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";

import { catchAsync } from "../utilities/catchAsync";
import { Room, IRoom } from "../models/room";
import { Hotel } from "../models/hotel";
import * as factory from "./handlerFactory";


export const toObjectId = (id: string) =>
  new Types.ObjectId(id);

// --------------------
// Extend Request
// --------------------
interface RoomRequest extends Request {
  params: {
    id?: string;
    hotelId?: string;
  };
  body: Partial<IRoom>;
}

// --------------------
// Create Room
// --------------------
export const create = catchAsync(
  async (req: RoomRequest, res: Response) => {
    const hotelId = req.params.hotelId;

    if (!hotelId) {
      throw new Error("Hotel ID is required");
    }

    const newRoom = await Room.create(req.body);

    await Hotel.findByIdAndUpdate(hotelId, {
      $push: { rooms: newRoom._id }
    });

    await Room.calcCheapestPrice(toObjectId(hotelId));

    res.status(201).json({
      status: "success",
      data: { room: newRoom }
    });
  }
);

// --------------------
// Delete Room
// --------------------
export const deleteRoom = catchAsync(
  async (req: RoomRequest, res: Response) => {
    const { id, hotelId } = req.params;

    const deletedRoom = await Room.findByIdAndDelete(id);

    if (hotelId) {
      await Hotel.findByIdAndUpdate(hotelId, {
        $pull: { rooms: id }
      });

      await Room.calcCheapestPrice(toObjectId(hotelId));
    }

    res.status(204).json({
      status: "success",
      data: { room: deletedRoom }
    });
  }
);

// --------------------
// Get All Rooms
// --------------------
export const getAll = catchAsync(
  async (req: Request, res: Response) => {
    const rooms = await Room.find();

    res.status(200).json({
      status: "success",
      count: rooms.length,
      data: { rooms }
    });
  }
);

// --------------------
// Get Room By ID
// --------------------
export const getById = catchAsync(
  async (req: RoomRequest, res: Response) => {
    const room = await Room.findById(req.params.id);

    res.status(200).json({
      status: "success",
      data: { room }
    });
  }
);

// --------------------
// Update Room
// --------------------
export const updateRoom = factory.updateOne<IRoom>(
  Room,
  "room"
);