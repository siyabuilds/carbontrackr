import express, { Request, Response, Router } from "express";
import { WeeklySummary } from "../models/WeeklySummary";
import { authenticateToken } from "../middleware/auth";

export const summariesRouter: Router = express.Router();

// GET /api/summaries/current - Get current week summary for the authenticated user
summariesRouter.get(
  "/current",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user._id;

      // Calculate current week start (Monday)
      const now = new Date();
      const day = now.getUTCDay();
      const diffToMonday = (day + 6) % 7;
      const monday = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate() - diffToMonday,
          0,
          0,
          0,
          0
        )
      );

      // Find current week summary
      const currentSummary = await WeeklySummary.findOne({
        userId,
        weekStart: monday,
      }).exec();

      if (!currentSummary) {
        return res.status(404).json({
          message: "Current week summary not found",
          error: "NOT_FOUND",
          details:
            "No summary exists for the current week. Try logging in again to generate it.",
        });
      }

      res.status(200).json({ summary: currentSummary });
    } catch (error) {
      console.error("Error fetching current week summary:", error);
      res.status(500).json({
        message: "Internal server error",
        error: "SERVER_ERROR",
        details: "An error occurred while fetching current week summary.",
      });
    }
  }
);

// GET /api/summaries/:weekStart - Get summary for a specific week
summariesRouter.get(
  "/:weekStart",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user._id;
      const weekStart = new Date(req.params.weekStart);

      // Validate date
      if (isNaN(weekStart.getTime())) {
        return res.status(400).json({
          message: "Invalid date format",
          error: "INVALID_DATE",
          details: "Week start date must be in ISO format (YYYY-MM-DD).",
        });
      }

      const summary = await WeeklySummary.findOne({
        userId,
        weekStart,
      }).exec();

      if (!summary) {
        return res.status(404).json({
          message: "Summary not found",
          error: "NOT_FOUND",
          details: "No summary exists for the specified week.",
        });
      }

      res.status(200).json({ summary });
    } catch (error) {
      console.error("Error fetching weekly summary:", error);
      res.status(500).json({
        message: "Internal server error",
        error: "SERVER_ERROR",
        details: "An error occurred while fetching the weekly summary.",
      });
    }
  }
);
