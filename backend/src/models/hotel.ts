
import fs from 'fs';
import { match } from 'assert';

import mongoose, {
  Schema,
  model,
  HydratedDocument,
  Query
} from "mongoose";


// --------------------
// 1. Interface
// --------------------

// Define interface for Amenities
export interface IAmenities {
    swimmingPool: boolean;
    gym: boolean;
    powerBackup: boolean;
    freeWifi: boolean;
    miniBar: boolean;
    roomService: boolean;
    elevator: boolean;
    kidsPlayArea: boolean;
}

export interface IAddress {
    addressLine1: string;
    addressLine2?: string;
    landmark?: string;
    zipCode: string;
    location: {
        type: 'Point';
        coordinates: number[];
    };
}
export interface IHotel  {
    name: string;
    description: string;
    type: 'hotel' | 'resort' | 'apartment' | 'villa' | 'cabin';
    category: string[];
    city: string;
    country: string;
    address: IAddress;
    distance: string;
    images: string[];
    avgRating: number;
    reviewCount: number;
    rooms: mongoose.Types.ObjectId[];
    cheapestPrice: number;
    featured: boolean;
    isDeleted: boolean;
    createdBy?: string;
    ammenities: IAmenities

}

// --------------------
// 2. Schema
// --------------------
const hotelSchema = new Schema<IHotel>(
  {
    name: {
      type: String,
      required: [true, "Hotel name is required"],
      trim: true,
      lowercase: true
    },
    description: {
      type: String,
      required: [true, "Hotel description is required"],
      trim: true
    },
    type: {
      type: String,
      required: [true, "Hotel type is required"],
      enum: {
        values: ["hotel", "resort", "apartment", "villa", "cabin"],
        message: "The provided hotel type is not valid"
      }
    },
    category: {
      type: [String],
      required: true
    },
    city: {
      type: String,
      required: [true, "Hotel city is required"]
    },
    country: {
      type: String,
      required: [true, "Hotel country is required"]
    },
    address: {
      addressLine1: {
        type: String,
        required: [true, "Address Line 1 is required"],
        maxlength: 100
      },
      addressLine2: {
        type: String,
        maxlength: 100
      },
      landmark: String,
      zipCode: {
        type: String,
        required: [true, "ZIP Code is required"]
      },
      location: {
        type: {
          type: String,
          enum: ["Point"],
          default: "Point"
        },
        coordinates: [Number]
      }
    },
    distance: {
      type: String,
      required: [true, "Hotel distance from airport is required"]
    },
    images: [String],
    avgRating: {
      type: Number,
      min: [0, "Ratings cannot be less than 0"],
      max: [5, "Ratings cannot be more than 5"],
      default: 3
    },
    reviewCount: {
      type: Number,
      default: 0
    },
    rooms: [
      {
        type: Schema.Types.ObjectId,
        ref: "Room"
      }
    ],
    cheapestPrice: {
      type: Number,
      required: true,
      default: 120
    },
    featured: {
      type: Boolean,
      default: false
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    createdBy: String,
    ammenities: {
      swimmingPool: { type: Boolean, default: false },
      gym: { type: Boolean, default: false },
      powerBackup: { type: Boolean, default: false },
      freeWifi: { type: Boolean, default: false },
      miniBar: { type: Boolean, default: false },
      roomService: { type: Boolean, default: false },
      elevator: { type: Boolean, default: false },
      kidsPlayArea: { type: Boolean, default: false }
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// --------------------
// 3. Index
// --------------------
hotelSchema.index({ cheapestPrice: 1, avgRating: -1 });

// --------------------
// 4. Virtual
// --------------------
hotelSchema.virtual("reviews", {
  ref: "Review",
  foreignField: "hotel",
  localField: "_id"
});

// --------------------
// 5. Middleware
// --------------------

// ✅ Pre save
hotelSchema.pre("save", function (this: HydratedDocument<IHotel>) {
  if (this.cheapestPrice < 1) {
    throw new Error("Price of a Hotel cannot be less than 1");
  }
});

// ✅ Post save
hotelSchema.post("save", function (doc: HydratedDocument<IHotel>) {
  const content = `${new Date()}: A new Hotel '${doc.name}' created by '${doc.createdBy}'.\n`;

  fs.writeFileSync("./logs/log.txt", content, { flag: "a" });
});

// ✅ Pre find (soft delete)
hotelSchema.pre(/^find/, function (this: Query<any, IHotel>) {
  this.where({ isDeleted: false });
});

// ✅ Pre update
hotelSchema.pre("findOneAndUpdate", function (this: Query<any, IHotel>) {
  const update = this.getUpdate() as Partial<IHotel>;

  //   const price =
//   update?.cheapestPrice ??
//   update?.$set?.cheapestPrice;

  if (update?.cheapestPrice !== undefined && update.cheapestPrice< 1) {
    throw new Error("Price cannot be zero or negative");
  }
});

// ✅ Post update
hotelSchema.post("findOneAndUpdate", function (doc: IHotel | null) {
  const content = `${new Date()}: Hotel '${
    doc?.name
  }' updated by '${doc?.createdBy}'.\n`;

  fs.writeFileSync("./logs/log.txt", content, { flag: "a" });
});

// ✅ Aggregate middleware
hotelSchema.pre("aggregate", function (this: any) {
  this.pipeline().unshift({ $match: { isDeleted: false } });
});

hotelSchema.post("aggregate", function (result: any[]) {
  console.log(result);
});

// --------------------
// 6. Model
// --------------------
export const Hotel = model<IHotel>("Hotel", hotelSchema);