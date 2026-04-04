import mongoose, {
  Schema,
  model,
  Model
} from "mongoose";
import { Hotel } from "./hotel";
// adjust path

// --------------------
// 1. Interface
// --------------------
export interface IRoom {
  title: string;
  description: string;
  price: number;
  maxPerson: number;
  roomNumber: number;
  bookedDates?: Date[];
}

// --------------------
// 2. Statics Interface
// --------------------
interface RoomModel extends Model<IRoom> {
  calcCheapestPrice(hotelId: mongoose.Types.ObjectId): Promise<void>;
}

// --------------------
// 3. Schema
// --------------------
const roomSchema = new Schema<IRoom, RoomModel>({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  maxPerson: {
    type: Number,
    required: true
  },
  roomNumber: {
    type: Number,
    required: true
  },
  bookedDates: [Date]
});

// --------------------
// 4. Static Method
// --------------------
roomSchema.statics.calcCheapestPrice = async function (
  hotelId: mongoose.Types.ObjectId
): Promise<void> {
  const hotel = await Hotel.findById(hotelId)
    .select("rooms")
    .lean();

  if (!hotel) return;

  // No rooms → fallback price
  if (!hotel.rooms || hotel.rooms.length === 0) {
    await Hotel.findByIdAndUpdate(hotelId, {
      cheapestPrice: 120
    });
    return;
  }

  const stats = await this.aggregate([
    { $match: { _id: { $in: hotel.rooms } } },
    {
      $group: {
        _id: null,
        minPrice: { $min: "$price" }
      }
    }
  ]);

  if (!stats.length) return;

  await Hotel.findByIdAndUpdate(hotelId, {
    cheapestPrice: stats[0].minPrice
  });
};

// --------------------
// 5. Model
// --------------------
export const Room = model<IRoom, RoomModel>(
  "Room",
  roomSchema
);