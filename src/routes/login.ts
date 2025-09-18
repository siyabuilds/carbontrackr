import express, { Express, Request, Response, Router } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { runCurrentWeekAnalysis } from "../jobs/weeklyAnalysis";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "carbon-footprint-tracker-secret-to-change-in-production";
export const loginRouter: Router = express.Router();

// POST /api/login
loginRouter.post("/", async (req: Request, res: Response) => {
  const { email, username, password } = req.body;
  const identifier = email || username;

  if (!identifier) {
    return res.status(400).json({
      message: "Missing required fields",
      error: "MISSING_FIELDS",
      details: "Email or username is required.",
    });
  }

  if (!password || password.length < 8) {
    return res.status(400).json({
      message: "Invalid password",
      error: "INVALID_PASSWORD",
      details: "Password must be at least 8 characters long.",
    });
  }

  try {
    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });
    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
        error: "INVALID_CREDENTIALS",
        details: "No user found with this email or username.",
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
        error: "INVALID_CREDENTIALS",
        details: "Incorrect password.",
      });
    }

    if (!JWT_SECRET) {
      return res.status(500).json({
        message: "Internal server error",
        error: "SERVER_ERROR",
        details: "JWT secret is not configured.",
      });
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    // Generate current week summary for the user upon login
    try {
      await runCurrentWeekAnalysis(user._id);
      console.log(
        `Current week summary generated for user ${user._id} on login`
      );
    } catch (analysisError) {
      console.error(
        `Failed to generate current week summary for user ${user._id}:`,
        analysisError
      );
    }

    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      error: "SERVER_ERROR",
      details: "An error occurred while processing your request.",
    });
  }
});
