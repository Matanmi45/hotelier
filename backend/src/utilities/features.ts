import { Query } from "mongoose";

// --------------------
// 1. Query Params Type
// --------------------
type QueryParams = {
  [key: string]: any;
  sort?: string;
  limit?: string;
  page?: string;
  fields?: string;
};

// --------------------
// 2. Class
// --------------------
export class ApiFeatures<T> {
  private queryObj: Query<T[], T>;
  private queryParam: QueryParams;

  constructor(queryObj: Query<T[], T>, queryParam: QueryParams) {
    this.queryObj = queryObj;
    this.queryParam = queryParam;
  }

  // --------------------
  // Filtering
  // --------------------
  filter() {
    const excludeFields = ["sort", "limit", "page", "fields"];

    const queryObj = { ...this.queryParam };

    excludeFields.forEach((el) => {
      delete queryObj[el];
    });

    const filterQuery = getFinalFilterQuery(queryObj);

    this.queryObj = this.queryObj.find(filterQuery);

    return this;
  }

  // --------------------
  // Sorting
  // --------------------
  sort() {
    if (this.queryParam.sort) {
      const sortBy = this.queryParam.sort.split(",").join(" ");
      this.queryObj = this.queryObj.sort(sortBy);
    } else {
      this.queryObj = this.queryObj.sort("cheapestPrice");
    }

    return this;
  }

  // --------------------
  // Field Limiting
  // --------------------
  limitFields() {
    if (this.queryParam.fields) {
      const fields = this.queryParam.fields.split(",").join(" ");
      this.queryObj = this.queryObj.select(fields);
    } else {
      this.queryObj = this.queryObj.select("-__v");
    }

    return this;
  }

  // --------------------
  // Pagination
  // --------------------
  paginate() {
    const limit = Number(this.queryParam.limit) || 10;
    const page = Number(this.queryParam.page) || 1;
    const skip = (page - 1) * limit;

    this.queryObj = this.queryObj.skip(skip).limit(limit);

    return this;
  }

  // --------------------
  // Getter (important)
  // --------------------
  getQuery() {
    return this.queryObj;
  }
}

// --------------------
// 3. Helper Function
// --------------------
type FilterQuery = Record<string, any>;

export const getFinalFilterQuery = (
  queryObj: Record<string, any>
): FilterQuery => {
  const finalFilterQuery: FilterQuery = {};

  for (const key in queryObj) {
    const value = queryObj[key];

    const match = key.match(/^(.*)\[(gt|gte|lt|lte)\]$/);

    if (match) {
      const fieldName = match[1];
      const operator = `$${match[2]}`;

      if (!finalFilterQuery[fieldName]) {
        finalFilterQuery[fieldName] = {};
      }

      finalFilterQuery[fieldName][operator] = value;
    } else {
      finalFilterQuery[key] = value;
    }
  }

  return finalFilterQuery;
};