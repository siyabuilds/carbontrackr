import mongoose from "mongoose";

const mongoURI =
  process.env.MONGO_URI || "mongodb://localhost:27017/carbontrackr";

export function initDb(): void {
  mongoose.connect(mongoURI);

  const db = mongoose.connection;

  db.on("error", console.error.bind(console, "MongoDB connection error:"));
  db.once("open", () => {
    console.log("Connected to MongoDB");
  });
}
