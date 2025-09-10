import mongoose from "mongoose";
import { Activity } from "../models/Activity";
import { WeeklySummary } from "../models/WeeklySummary";

function getLastWeekRange(now = new Date()) {
  // Define week as Monday 00:00:00 to next Monday 00:00:00 UTC
  const d = new Date(now);
  const day = d.getUTCDay();
  const diffToMonday = (day + 6) % 7;
  const monday = new Date(
    Date.UTC(
      d.getUTCFullYear(),
      d.getUTCMonth(),
      d.getUTCDate() - diffToMonday,
      0,
      0,
      0,
      0
    )
  );
  const thisWeekStart = monday; // current week's Monday
  const lastWeekEnd = thisWeekStart; // exclusive
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setUTCDate(thisWeekStart.getUTCDate() - 7);
  return { start: lastWeekStart, end: lastWeekEnd };
}

export async function runWeeklyAnalysis(referenceDate?: Date) {
  const { start, end } = getLastWeekRange(referenceDate);

  // Aggregate activities from last week per user and category
  const pipeline = [
    {
      $match: {
        date: { $gte: start, $lt: end },
      },
    },
    {
      $group: {
        _id: { userId: "$userId", category: "$category" },
        totalValue: { $sum: "$value" },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: "$_id.userId",
        byCategory: {
          $push: {
            k: "$_id.category",
            v: { total: "$totalValue", count: "$count" },
          },
        },
        totalValue: { $sum: "$totalValue" },
        activitiesCount: { $sum: "$count" },
      },
    },
  ];

  type AggDoc = {
    _id: mongoose.Types.ObjectId;
    byCategory: { k: string; v: { total: number; count: number } }[];
    totalValue: number;
    activitiesCount: number;
  };

  const results = (await Activity.aggregate(pipeline)) as AggDoc[];

  // Upsert WeeklySummary per user
  const ops = results.map((r) => {
    const byCategoryTotals: Record<string, number> = {};
    const byCategoryCounts: Record<string, number> = {};
    for (const entry of r.byCategory) {
      byCategoryTotals[entry.k] = entry.v.total;
      byCategoryCounts[entry.k] = entry.v.count;
    }

    return WeeklySummary.updateOne(
      { userId: r._id, weekStart: start },
      {
        $set: {
          userId: r._id,
          weekStart: start,
          weekEnd: end,
          totalValue: r.totalValue,
          activitiesCount: r.activitiesCount,
          byCategoryTotals,
          byCategoryCounts,
          generatedAt: new Date(),
        },
      },
      { upsert: true }
    );
  });

  await Promise.all(ops);

  return { start, end, processedUsers: results.length };
}
