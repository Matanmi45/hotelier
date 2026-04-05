import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "";

if (!MONGODB_URI) {
  throw new Error("❌ Please define the MONGODB_URI in your environment variables");
}

// Track connection state
let isConnected = false;
let retryAttempts = 0;
const MAX_RETRIES = 4;

// Main connection function
export const connectDB = async (): Promise<void> => {
  if (isConnected) {
    console.log("⚡ MongoDB already connected");
    return;
  }

  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });

    isConnected = true;
    retryAttempts = 0;

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    reconnectWithBackoff();
  }
};

// 🔁 Reconnect with limit
const reconnectWithBackoff = () => {
  if (retryAttempts >= MAX_RETRIES) {
    console.error(
      `🚫 Max reconnection attempts (${MAX_RETRIES}) reached. Exiting...`
    );
    process.exit(1); // stop app (you can change this behavior)
  }

  const delay = Math.min(5000 * 2 ** retryAttempts, 30000);

  console.log(
    `🔁 Retry ${retryAttempts + 1}/${MAX_RETRIES} in ${delay / 1000}s...`
  );

  setTimeout(async () => {
    retryAttempts++;

    try {
      await connectDB();
    } catch {
      reconnectWithBackoff();
    }
  }, delay);
};

// ==============================
// 📡 MONGOOSE EVENTS
// ==============================

mongoose.connection.on("connected", () => {
  console.log("🟢 Mongoose connected");
});

mongoose.connection.on("error", (err) => {
  console.error("🔴 Mongoose error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.warn("🟡 Mongoose disconnected");

  isConnected = false;

  // Only try reconnect if we haven't exceeded max retries
  reconnectWithBackoff();
});

// ==============================
// 🛑 GRACEFUL SHUTDOWN
// ==============================

const gracefulShutdown = async (signal: string) => {
  console.log(`⚠️ Received ${signal}. Closing MongoDB connection...`);

  try {
    await mongoose.connection.close();
    console.log("🔌 MongoDB connection closed");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error during shutdown:", err);
    process.exit(1);
  }
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);
process.on("SIGQUIT", gracefulShutdown);