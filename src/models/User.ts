import mongoose, { Document } from "mongoose";
import bcrypt from "bcrypt";

// Interface for User document
export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  createdAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

// User schema for MongoDB
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 5,
      maxlength: 17,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      maxlength: 32,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: "users",
  }
);

// Hash password before saving(used for register)
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err: any) {
    next(err);
  }
});

// Compare password with hashed password (used for login)
userSchema.methods.comparePassword = async function (password: string) {
  try {
    return await bcrypt.compare(password, this.password);
  } catch (err: any) {
    throw new Error("Password comparison failed");
  }
};

export const User = mongoose.model<IUser>("User", userSchema);
