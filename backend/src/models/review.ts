import { Hotel }from '@/models/hotel';

import mongoose, {
  Schema,
  model,
  HydratedDocument,
  Model,
  Query
} from "mongoose";


// --------------------
// 1. Interface
// --------------------
export interface IReview {
  ratings: number;
  comment: string;
  user: mongoose.Types.ObjectId;
  hotel: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

// --------------------
// 2. Statics Interface
// --------------------
interface ReviewModel extends Model<IReview> {
  calcAverageRatings(hotelId: mongoose.Types.ObjectId): Promise<void>;
}

// --------------------
// 3. Schema
// --------------------
const reviewSchema = new Schema<IReview, ReviewModel>(
  {
    ratings: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      required: true
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    hotel: {
      type: Schema.Types.ObjectId,
      ref: "Hotel",
      required: true
    }
  },
  { timestamps: true }
);

// --------------------
// 4. Index (prevent duplicate reviews per user)
// --------------------
reviewSchema.index({ hotel: 1, user: 1 }, { unique: true });

// --------------------
// 5. Query Middleware (populate user)
// --------------------
reviewSchema.pre(/^find/, function (this: Query<any, IReview>) {
  this.populate({
    path: "user",
    select: "firstname lastname photo"
  });
});

// --------------------
// 6. Static Method
// --------------------
reviewSchema.statics.calcAverageRatings = async function (
  hotelId: mongoose.Types.ObjectId
): Promise<void> {
  const stats = await this.aggregate([
    { $match: { hotel: hotelId } },
    {
      $group: {
        _id: "$hotel",
        count: { $sum: 1 },
        avgRating: { $avg: "$ratings" }
      }
    }
  ]);

  if (stats.length > 0) {
    await Hotel.findByIdAndUpdate(hotelId, {
      avgRating: stats[0].avgRating,
      reviewCount: stats[0].count
    });
  } else {
    await Hotel.findByIdAndUpdate(hotelId, {
      avgRating: 3,
      reviewCount: 0
    });
  }
};

// --------------------
// 7. Post Save Middleware
// --------------------
reviewSchema.post("save", function (doc: HydratedDocument<IReview>) {
  const Model = doc.constructor as ReviewModel;
  Model.calcAverageRatings(doc.hotel);
});

// --------------------
// 8. Post Update/Delete Middleware
// --------------------
reviewSchema.post(
  /^findOneAnd/,
  async function (doc: HydratedDocument<IReview> | null) {
    if (!doc) return;

    const Model = doc.constructor as ReviewModel;
    await Model.calcAverageRatings(doc.hotel);
  }
);

// --------------------
// 9. Model
// --------------------
export const Review = model<IReview, ReviewModel>(
  "Review",
  reviewSchema
);