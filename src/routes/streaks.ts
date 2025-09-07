import express, { Request, Response, Router } from "express";
import { Activity } from "../models/Activity";
import mongoose from "mongoose";
import { authenticateToken } from "../middleware/auth";

const streaksRouter: Router = express.Router();

// GET /streaks - Get 7-day streak for the authenticated user
streaksRouter.get(
  "/",
  authenticateToken,
  async (req: Request, res: Response) => {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      // Get activities for the last 7 days (including today)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 6);

      // Find distinct days the user has activities
      const streakDays = await Activity.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            date: { $gte: sevenDaysAgo, $lte: today },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$date" },
              month: { $month: "$date" },
              day: { $dayOfMonth: "$date" },
            },
          },
        },
        {
          $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 },
        },
      ]);

      // Build streak array for the last 7 days
      const streak = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(sevenDaysAgo);
        d.setDate(sevenDaysAgo.getDate() + i);
        const found = streakDays.find(
          (s) =>
            s._id.year === d.getFullYear() &&
            s._id.month === d.getMonth() + 1 &&
            s._id.day === d.getDate()
        );
        streak.push({ date: d.toISOString().slice(0, 10), active: !!found });
      }

      // Calculate current streak
      let currentStreak = 0;
      for (let i = 6; i >= 0; i--) {
        if (streak[i].active) currentStreak++;
        else break;
      }

      res.json({ streak, currentStreak });
    } catch (err) {
      res.status(500).json({ error: "Server error", details: err });
    }
  }
);

export { streaksRouter };
