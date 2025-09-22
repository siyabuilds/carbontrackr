import express, { Request, Response, Router } from "express";
import { ReductionTarget } from "../models/ReductionTarget";
import { authenticateToken } from "../middleware/auth";

export const reductionTargetsRouter: Router = express.Router();

// GET /api/targets - Get active reduction target for the authenticated user
reductionTargetsRouter.get(
  "/",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user._id;
      const targetPeriod =
        (req.query.period as "weekly" | "monthly") || "weekly";

      const activeTarget = await ReductionTarget.findOne({
        userId,
        targetPeriod,
        isActive: true,
      }).exec();

      if (!activeTarget) {
        return res.status(404).json({
          message: "No active reduction target found",
          error: "NOT_FOUND",
          details: "Set a reduction target to start tracking your progress.",
        });
      }

      res.status(200).json({ target: activeTarget });
    } catch (error) {
      console.error("Error fetching reduction target:", error);
      res.status(500).json({
        message: "Internal server error",
        error: "SERVER_ERROR",
        details: "An error occurred while fetching the reduction target.",
      });
    }
  }
);

// POST /api/targets - Create a new reduction target
reductionTargetsRouter.post(
  "/",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user._id;
      const {
        targetType = "percentage",
        targetValue,
        description,
        targetPeriod = "weekly",
        categories = [],
      } = req.body;

      // Validation
      if (!targetValue || typeof targetValue !== "number" || targetValue <= 0) {
        return res.status(400).json({
          message: "Invalid target value",
          error: "INVALID_INPUT",
          details: "Target value must be a positive number.",
        });
      }

      if (targetType === "percentage" && targetValue > 100) {
        return res.status(400).json({
          message: "Invalid percentage target",
          error: "INVALID_INPUT",
          details: "Percentage target cannot exceed 100%.",
        });
      }

      if (!["percentage", "absolute"].includes(targetType)) {
        return res.status(400).json({
          message: "Invalid target type",
          error: "INVALID_INPUT",
          details: "Target type must be 'percentage' or 'absolute'.",
        });
      }

      if (!["weekly", "monthly"].includes(targetPeriod)) {
        return res.status(400).json({
          message: "Invalid target period",
          error: "INVALID_INPUT",
          details: "Target period must be 'weekly' or 'monthly'.",
        });
      }

      // Deactivate any existing active target for this period
      await ReductionTarget.updateMany(
        { userId, targetPeriod, isActive: true },
        { $set: { isActive: false } }
      );

      // Create new target
      const newTarget = new ReductionTarget({
        userId,
        targetType,
        targetValue,
        description,
        targetPeriod,
        categories,
        isActive: true,
      });

      await newTarget.save();

      res.status(201).json({
        message: "Reduction target created successfully",
        target: newTarget,
      });
    } catch (error: any) {
      console.error("Error creating reduction target:", error);

      if (error.name === "ValidationError") {
        return res.status(400).json({
          message: "Validation error",
          error: "VALIDATION_ERROR",
          details: error.message,
        });
      }

      res.status(500).json({
        message: "Internal server error",
        error: "SERVER_ERROR",
        details: "An error occurred while creating the reduction target.",
      });
    }
  }
);

// PUT /api/targets/:id - Update an existing reduction target
reductionTargetsRouter.put(
  "/:id",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user._id;
      const targetId = req.params.id;
      const {
        targetType,
        targetValue,
        description,
        targetPeriod,
        categories,
        isActive,
      } = req.body;

      // Find the target to update
      const existingTarget = await ReductionTarget.findOne({
        _id: targetId,
        userId,
      });

      if (!existingTarget) {
        return res.status(404).json({
          message: "Reduction target not found",
          error: "NOT_FOUND",
          details:
            "Target not found or you don't have permission to modify it.",
        });
      }

      // Validation
      if (targetValue !== undefined) {
        if (typeof targetValue !== "number" || targetValue <= 0) {
          return res.status(400).json({
            message: "Invalid target value",
            error: "INVALID_INPUT",
            details: "Target value must be a positive number.",
          });
        }

        if (
          (targetType || existingTarget.targetType) === "percentage" &&
          targetValue > 100
        ) {
          return res.status(400).json({
            message: "Invalid percentage target",
            error: "INVALID_INPUT",
            details: "Percentage target cannot exceed 100%.",
          });
        }
      }

      if (targetType && !["percentage", "absolute"].includes(targetType)) {
        return res.status(400).json({
          message: "Invalid target type",
          error: "INVALID_INPUT",
          details: "Target type must be 'percentage' or 'absolute'.",
        });
      }

      if (targetPeriod && !["weekly", "monthly"].includes(targetPeriod)) {
        return res.status(400).json({
          message: "Invalid target period",
          error: "INVALID_INPUT",
          details: "Target period must be 'weekly' or 'monthly'.",
        });
      }

      // If activating this target, deactivate others for the same period
      if (isActive === true) {
        const period = targetPeriod || existingTarget.targetPeriod;
        await ReductionTarget.updateMany(
          {
            userId,
            targetPeriod: period,
            isActive: true,
            _id: { $ne: targetId },
          },
          { $set: { isActive: false } }
        );
      }

      // Update the target
      const updateData: any = {};
      if (targetType !== undefined) updateData.targetType = targetType;
      if (targetValue !== undefined) updateData.targetValue = targetValue;
      if (description !== undefined) updateData.description = description;
      if (targetPeriod !== undefined) updateData.targetPeriod = targetPeriod;
      if (categories !== undefined) updateData.categories = categories;
      if (isActive !== undefined) updateData.isActive = isActive;

      const updatedTarget = await ReductionTarget.findByIdAndUpdate(
        targetId,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      res.status(200).json({
        message: "Reduction target updated successfully",
        target: updatedTarget,
      });
    } catch (error: any) {
      console.error("Error updating reduction target:", error);

      if (error.name === "ValidationError") {
        return res.status(400).json({
          message: "Validation error",
          error: "VALIDATION_ERROR",
          details: error.message,
        });
      }

      res.status(500).json({
        message: "Internal server error",
        error: "SERVER_ERROR",
        details: "An error occurred while updating the reduction target.",
      });
    }
  }
);

// DELETE /api/targets/:id - Delete (deactivate) a reduction target
reductionTargetsRouter.delete(
  "/:id",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user._id;
      const targetId = req.params.id;

      const target = await ReductionTarget.findOne({
        _id: targetId,
        userId,
      });

      if (!target) {
        return res.status(404).json({
          message: "Reduction target not found",
          error: "NOT_FOUND",
          details: "Target not found",
        });
      }

      // Deactivate the target instead of deleting it
      target.isActive = false;
      await target.save();

      res.status(200).json({
        message: "Reduction target deactivated successfully",
      });
    } catch (error) {
      console.error("Error deleting reduction target:", error);
      res.status(500).json({
        message: "Internal server error",
        error: "SERVER_ERROR",
        details: "An error occurred while deleting the reduction target.",
      });
    }
  }
);

// GET /api/targets/history - Get all reduction targets for the user (including inactive)
reductionTargetsRouter.get(
  "/history",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user._id;
      const targetPeriod =
        (req.query.period as "weekly" | "monthly") || "weekly";

      const targets = await ReductionTarget.find({
        userId,
        targetPeriod,
      })
        .sort({ createdAt: -1 })
        .exec();

      res.status(200).json({ targets });
    } catch (error) {
      console.error("Error fetching reduction target history:", error);
      res.status(500).json({
        message: "Internal server error",
        error: "SERVER_ERROR",
        details: "An error occurred while fetching target history.",
      });
    }
  }
);
