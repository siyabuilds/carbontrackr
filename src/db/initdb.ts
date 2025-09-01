import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const mongoURI =
  process.env.MONGO_URI || "mongodb://localhost:27017/carbontrackr";
const clientOptions = {
  serverApi: { version: "1" as const, strict: true, deprecationErrors: true },
};

export async function initDb() {
  console.log(
    `Connecting to MongoDB... using the connection string: ${mongoURI}`
  );
  try {
    await mongoose.connect(mongoURI, clientOptions);
    if (mongoose.connection.db) {
      await mongoose.connection.db.admin().command({ ping: 1 });
    } else {
      throw new Error("Database connection is undefined.");
    }
    console.log("Successfully connected to MongoDB!");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    throw err;
  }
}
