import mongoose from "mongoose";

export interface ReductionTargetDoc extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  targetType: "percentage" | "absolute";
  targetValue: number;
  description?: string;
  isActive: boolean;
  targetPeriod: "weekly" | "monthly";
  categories?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const reductionTargetSchema = new mongoose.Schema<ReductionTargetDoc>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      required: true,
      enum: ["percentage", "absolute"],
      default: "percentage",
    },
    targetValue: {
      type: Number,
      required: true,
      min: [0, "Target value must be positive"],
      max: [100, "Percentage target cannot exceed 100%"],
      validate: {
        validator: function (this: ReductionTargetDoc, value: number) {
          if (this.targetType === "percentage") {
            return value >= 0 && value <= 100;
          }
          return value >= 0;
        },
        message: "Invalid target value for the selected target type",
      },
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, "Description cannot exceed 200 characters"],
    },
    isActive: {
      type: Boolean,
      default: true,
      required: true,
    },
    targetPeriod: {
      type: String,
      required: true,
      enum: ["weekly", "monthly"],
      default: "weekly",
    },
    categories: {
      type: [String],
      default: [],
      validate: {
        validator: function (categories: string[]) {
          // Validate that all categories are valid emission categories
          const validCategories = [
            "transportation",
            "energy",
            "food",
            "waste",
            "shopping",
            "other",
          ];
          return categories.every((cat) => validCategories.includes(cat));
        },
        message: "Invalid category specified",
      },
    },
  },
  {
    collection: "reduction_targets",
    timestamps: true,
  }
);

// Compound index to ensure one active target per user per period
reductionTargetSchema.index(
  { userId: 1, targetPeriod: 1, isActive: 1 },
  {
    unique: true,
    partialFilterExpression: { isActive: true },
  }
);

// Static method to get active target for user
reductionTargetSchema.statics.getActiveTarget = function (
  userId: mongoose.Types.ObjectId,
  targetPeriod: "weekly" | "monthly" = "weekly"
) {
  return this.findOne({
    userId,
    targetPeriod,
    isActive: true,
  });
};

// Instance method to deactivate target
reductionTargetSchema.methods.deactivate = function () {
  this.isActive = false;
  return this.save();
};

export const ReductionTarget = mongoose.model<ReductionTargetDoc>(
  "ReductionTarget",
  reductionTargetSchema
);
