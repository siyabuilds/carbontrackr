import express, { Request, Response, NextFunction, Router } from "express";
import { authenticateToken } from "../middleware/auth";
import { Activity } from "../models/Activity";
import { IUser } from "../models/User";
import mongoose from "mongoose";

const activitiesRouter: Router = express.Router();

// GET /api/activities
activitiesRouter.get(
  "/",
  authenticateToken,
  async (req: Request, res: Response) => {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const activities = await Activity.find({ userId });
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// POST /api/activities
activitiesRouter.post(
  "/",
  authenticateToken,
  async (req: Request, res: Response) => {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const newActivity = new Activity({
        userId,
        ...req.body,
      });
      await newActivity.save();
      res.status(201).json(newActivity);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// DELETE single activity
activitiesRouter.delete(
  "/:id",
  authenticateToken,
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const activityId = req.params.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const deletedActivity = await Activity.findOneAndDelete({
        _id: activityId,
        userId,
      });
      if (!deletedActivity) {
        return res.status(404).json({ message: "Activity not found" });
      }
      res.status(200).json({ message: "Activity deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// DELETE all activities
activitiesRouter.delete(
  "/",
  authenticateToken,
  async (req: Request, res: Response) => {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      await Activity.deleteMany({ userId });
      res.status(200).json({ message: "All activities deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Calculate average emissions across all users
activitiesRouter.get(
  "/average-emissions",
  async (req: Request, res: Response) => {
    try {
      const result = await Activity.aggregate([
        {
          $group: {
            _id: "$category",
            averageEmission: { $avg: "$value" },
          },
        },
      ]);

      const averages = result.map((item) => ({
        category: item._id,
        averageEmission: item.averageEmission,
      }));

      res.json(averages);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// GET /api/activities/leaderboard - Get top 10 users with lowest emissions
activitiesRouter.get("/leaderboard", async (req: Request, res: Response) => {
  try {
    const leaderboard = await Activity.aggregate([
      {
        $group: {
          _id: "$userId",
          totalEmissions: { $sum: "$value" },
          activityCount: { $sum: 1 },
        },
      },
      {
        $match: {
          activityCount: { $gt: 0 },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $project: {
          _id: 1,
          totalEmissions: 1,
          activityCount: 1,
          username: "$user.username",
          fullName: "$user.fullName",
        },
      },
      {
        $sort: { totalEmissions: 1 },
      },
      {
        $limit: 10,
      },
    ]);

    // Add rank to each user
    const rankedLeaderboard = leaderboard.map((user, index) => ({
      rank: index + 1,
      userId: user._id,
      username: user.username,
      fullName: user.fullName,
      totalEmissions: Math.round(user.totalEmissions * 100) / 100,
      activityCount: user.activityCount,
    }));

    res.json(rankedLeaderboard);
  } catch (error) {
    console.error("Leaderboard error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export { activitiesRouter };
