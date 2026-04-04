import jwt, { SignOptions } from "jsonwebtoken";
import { Types } from "mongoose";

interface JwtPayload {
  userId: string;
}

export const signToken = (
  userId: string | Types.ObjectId
): string => {
  const payload: JwtPayload = {
    userId: userId.toString()
  };

  return jwt.sign(
    payload,
    process.env.SECRET_KEY!,
    { expiresIn: parseInt(process.env.LOGIN_EXPIRES || "3600", 10) }
  );
};