import mongoose from "mongoose";

export interface WeeklySummaryDoc extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  weekStart: Date;
  weekEnd: Date;
  totalValue: number;
  activitiesCount: number;
  byCategoryTotals: Map<string, number>;
  byCategoryCounts: Map<string, number>;
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
