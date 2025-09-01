import express, { Request, Response, NextFunction, Router } from "express";
import { authenticateToken } from "../middleware/auth";
import { Activity } from "../models/Activity";

const activitiesRouter: Router = express.Router();

// GET /api/activities
activitiesRouter.get(
  "/",
  authenticateToken,
  async (req: Request, res: Response) => {
    const userId = req.user?.id || req.user._id;

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
    const userId = req.user?.id || req.user._id;

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
    const userId = req.user?.id || req.user._id;
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
    const userId = req.user?.id || req.user._id;

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

export { activitiesRouter };
