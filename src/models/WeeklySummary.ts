import mongoose from "mongoose";

export interface WeeklySummaryDoc extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  weekStart: Date;
  weekEnd: Date;
  totalValue: number;
  activitiesCount: number;
  byCategoryTotals: Map<string, number>;
  byCategoryCounts: Map<string, number>;
  highestEmissionCategory: {
    category: string;
    emissions: number;
    activityCount: number;
  } | null;
  lowestEmissionCategory: {
    category: string;
    emissions: number;
    activityCount: number;
  } | null;
  personalizedTip: {
    category: string;
    message: string;
    tipType: "positive" | "improvement";
  } | null;
  reductionTarget: {
    targetValue: number;
    targetType: "percentage" | "absolute";
    previousWeekEmissions: number | null;
    reductionAchieved: number | null;
    progressPercentage: number | null;
    targetMet: boolean;
  } | null;
  generatedAt: Date;
}

const weeklySummarySchema = new mongoose.Schema<WeeklySummaryDoc>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    weekStart: { type: Date, required: true },
    weekEnd: { type: Date, required: true },
    totalValue: { type: Number, required: true, default: 0 },
    activitiesCount: { type: Number, required: true, default: 0 },
    byCategoryTotals: { type: Map, of: Number, default: {} },
    byCategoryCounts: { type: Map, of: Number, default: {} },
    highestEmissionCategory: {
      category: { type: String },
      emissions: { type: Number },
      activityCount: { type: Number },
    },
    lowestEmissionCategory: {
      category: { type: String },
      emissions: { type: Number },
      activityCount: { type: Number },
    },
    personalizedTip: {
      category: { type: String },
      message: { type: String },
      tipType: { type: String, enum: ["positive", "improvement"] },
    },
    reductionTarget: {
      targetValue: { type: Number },
      targetType: { type: String, enum: ["percentage", "absolute"] },
      previousWeekEmissions: { type: Number },
      reductionAchieved: { type: Number },
      progressPercentage: { type: Number },
      targetMet: { type: Boolean },
    },
    generatedAt: { type: Date, default: Date.now },
  },
  {
    collection: "weekly_summaries",
    timestamps: true,
  }
);

weeklySummarySchema.index({ userId: 1, weekStart: 1 }, { unique: true });

export const WeeklySummary = mongoose.model<WeeklySummaryDoc>(
  "WeeklySummary",
  weeklySummarySchema
);
