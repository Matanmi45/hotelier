import mongoose from "mongoose";
import dotenv from "dotenv";

import app from "./app";

// --------------------
// Load Env Variables
// --------------------
dotenv.config({ path: "./config.env" });

// --------------------
// Handle Uncaught Exceptions
// --------------------
process.on("uncaughtException", (error: Error) => {
  console.error(`${error.name}: ${error.message}`);
  console.error("Uncaught Exception. Shutting down...");
  process.exit(1);
});

// --------------------
// Database Connection
// --------------------
const connString = process.env.CONNECTION_STRING as string;

mongoose
  .connect(connString)
  .then(() => {
    console.log("Connection to DB Successful");
  })
  .catch((err: Error) => {
    console.error("Could not connect to MongoDB", err);
  });

// --------------------
// Start Server
// --------------------
const port = Number(process.env.PORT) || 3000;

const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// --------------------
// Handle Unhandled Rejections
// --------------------
process.on("unhandledRejection", (error: Error) => {
  console.error(`${error.name}: ${error.message}`);
  console.error("Unhandled Rejection. Shutting down...");

  server.close(() => {
    process.exit(1);
  });
});