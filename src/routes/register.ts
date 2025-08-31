import express, { Request, Response, NextFunction, Router } from "express";
import dotenv from "dotenv";
const User = require("../models/User");
dotenv.config();

const registerRouter: Router = express.Router();
const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;

registerRouter.post(
  "/",
  async (req: Request, res: Response, next: NextFunction) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        message: "Missing required fields",
        error: "MISSING_FIELDS",
        details: "Username, email, and password are all required.",
      });
    }

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Invalid email format",
        error: "INVALID_EMAIL",
        details: "Please provide a valid email address.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password is too short",
        error: "INVALID_PASSWORD",
        details: "Password must be at least 6 characters long.",
      });
    }

    try {
      const existingEmail = await User.findOne({
        email,
      });
      if (existingEmail) {
        return res.status(400).json({
          message: "User already exists",
          error: "USER_EXISTS",
          details: "An account with this email already exists.",
        });
      }
      const existingUsername = await User.findOne({
        username,
      });
      if (existingUsername) {
        return res.status(400).json({
          message: "User already exists",
          error: "USER_EXISTS",
          details: "An account with this username already exists.",
        });
      }
      const newUser = new User({ username, email, password });
      await newUser.save();
    } catch (error) {
      return res.status(500).json({
        message: "Internal server error",
        error: "SERVER_ERROR",
        details: "An error occurred while checking for existing user.",
      });
    }

    res.status(201).json({ message: "User registered successfully" });
  }
);

export default registerRouter;
