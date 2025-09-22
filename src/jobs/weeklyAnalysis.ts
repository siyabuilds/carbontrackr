import mongoose from "mongoose";
import { Activity } from "../models/Activity";
import { WeeklySummary } from "../models/WeeklySummary";
import { ReductionTarget } from "../models/ReductionTarget";
import { tipData } from "../utils/tip";

// Helper function to calculate reduction progress
async function calculateReductionProgress(
  userId: mongoose.Types.ObjectId,
  currentEmissions: number,
  currentWeekStart: Date
): Promise<{
  targetValue: number;
  targetType: "percentage" | "absolute";
  previousWeekEmissions: number | null;
  reductionAchieved: number | null;
  progressPercentage: number | null;
  targetMet: boolean;
} | null> {
  try {
    // Get active weekly reduction target for user
    const activeTarget = await ReductionTarget.findOne({
      userId,
      targetPeriod: "weekly",
      isActive: true,
    });

    if (!activeTarget) {
      return null;
    }

    // Calculate previous week start
    const prevWeekStart = new Date(currentWeekStart);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);

    // Get previous week's summary to compare
    const previousSummary = await WeeklySummary.findOne({
      userId,
      weekStart: prevWeekStart,
    });

    const previousWeekEmissions = previousSummary?.totalValue || null;

    if (previousWeekEmissions === null) {
      // No previous week data available
      return {
        targetValue: activeTarget.targetValue,
        targetType: activeTarget.targetType,
        previousWeekEmissions: null,
        reductionAchieved: null,
        progressPercentage: null,
        targetMet: false,
      };
    }

    let reductionAchieved: number;
    let progressPercentage: number;
    let targetMet: boolean;

    if (activeTarget.targetType === "percentage") {
      // Calculate percentage reduction achieved
      reductionAchieved =
        ((previousWeekEmissions - currentEmissions) / previousWeekEmissions) *
        100;
      progressPercentage = (reductionAchieved / activeTarget.targetValue) * 100;
      targetMet = reductionAchieved >= activeTarget.targetValue;
    } else {
      // Absolute reduction target
      reductionAchieved = previousWeekEmissions - currentEmissions;
      progressPercentage = (reductionAchieved / activeTarget.targetValue) * 100;
      targetMet = reductionAchieved >= activeTarget.targetValue;
    }

    return {
      targetValue: activeTarget.targetValue,
      targetType: activeTarget.targetType,
      previousWeekEmissions,
      reductionAchieved: Number(reductionAchieved.toFixed(2)),
      progressPercentage: Number(Math.max(0, progressPercentage).toFixed(1)),
      targetMet,
    };
  } catch (error) {
    console.error("Error calculating reduction progress:", error);
    return null;
  }
}

// Helper function to find highest and lowest emission categories
function analyzeEmissionCategories(
  byCategoryTotals: Record<string, number>,
  byCategoryCounts: Record<string, number>
) {
  const categories = Object.entries(byCategoryTotals);

  if (categories.length === 0) {
    return { highest: null, lowest: null };
  }

  // Sort by emissions (highest first)
  categories.sort((a, b) => b[1] - a[1]);

  const [highestCategory, highestEmissions] = categories[0];
  const [lowestCategory, lowestEmissions] = categories[categories.length - 1];

  return {
    highest: {
      category: highestCategory,
      emissions: Number(highestEmissions.toFixed(2)),
      activityCount: byCategoryCounts[highestCategory] || 0,
    },
    lowest: {
      category: lowestCategory,
      emissions: Number(lowestEmissions.toFixed(2)),
      activityCount: byCategoryCounts[lowestCategory] || 0,
    },
  };
}

// Helper function to generate personalized tip
async function generatePersonalizedTip(
  userId: mongoose.Types.ObjectId,
  highestCategory: string,
  weekStart: Date,
  weekEnd: Date,
  reductionProgress?: {
    targetValue: number;
    targetType: "percentage" | "absolute";
    previousWeekEmissions: number | null;
    reductionAchieved: number | null;
    progressPercentage: number | null;
    targetMet: boolean;
  } | null
): Promise<{
  category: string;
  message: string;
  tipType: "positive" | "improvement";
} | null> {
  try {
    // Get the most frequent activity in the highest emission category for this user
    const topActivity = await Activity.findOne({
      userId,
      category: highestCategory,
      date: { $gte: weekStart, $lt: weekEnd },
    })
      .sort({ value: -1 }) // Get the highest emission activity
      .exec();

    if (!topActivity) {
      return null;
    }

    // Generate target-aware tips if reduction progress is available
    if (reductionProgress) {
      if (reductionProgress.targetMet) {
        return {
          category: highestCategory,
          message: `Great job! You've met your ${
            reductionProgress.targetType === "percentage"
              ? `${reductionProgress.targetValue}% reduction`
              : `${reductionProgress.targetValue} kg reduction`
          } target. Keep up the excellent work on reducing ${highestCategory} emissions!`,
          tipType: "positive",
        };
      } else if (
        reductionProgress.progressPercentage !== null &&
        reductionProgress.progressPercentage > 50
      ) {
        return {
          category: highestCategory,
          message: `You're ${reductionProgress.progressPercentage.toFixed(
            1
          )}% towards your reduction target! Focus on reducing ${
            topActivity.activity
          } in ${highestCategory} to reach your goal.`,
          tipType: "improvement",
        };
      } else if (
        reductionProgress.reductionAchieved !== null &&
        reductionProgress.reductionAchieved < 0
      ) {
        return {
          category: highestCategory,
          message: `Your ${highestCategory} emissions increased this week. Try reducing ${topActivity.activity} activities to get back on track with your target.`,
          tipType: "improvement",
        };
      }
    }

    // Fall back to standard tips
    const tips = tipData[highestCategory]?.[topActivity.activity];
    if (!tips) {
      return {
        category: highestCategory,
        message: `Consider reducing activities in ${highestCategory} to lower your carbon footprint.`,
        tipType: "improvement",
      };
    }

    const isPositive = typeof tips === "string";
    const message = isPositive
      ? tips
      : tips[Math.floor(Math.random() * tips.length)];

    return {
      category: highestCategory,
      message,
      tipType: isPositive ? "positive" : "improvement",
    };
  } catch (error) {
    console.error("Error generating personalized tip:", error);
    return null;
  }
}

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

function getCurrentWeekRange(now = new Date()) {
  // Define week as Monday 00:00:00 to current time
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
  return { start: monday, end: now };
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
  const ops = results.map(async (r) => {
    const byCategoryTotals: Record<string, number> = {};
    const byCategoryCounts: Record<string, number> = {};
    for (const entry of r.byCategory) {
      byCategoryTotals[entry.k] = entry.v.total;
      byCategoryCounts[entry.k] = entry.v.count;
    }

    // Analyze emission categories
    const { highest, lowest } = analyzeEmissionCategories(
      byCategoryTotals,
      byCategoryCounts
    );

    // Calculate reduction progress (for last week analysis)
    const reductionProgress = await calculateReductionProgress(
      r._id,
      r.totalValue,
      start
    );

    // Generate personalized tip
    const personalizedTip = highest
      ? await generatePersonalizedTip(
          r._id,
          highest.category,
          start,
          end,
          reductionProgress
        )
      : null;

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
          highestEmissionCategory: highest,
          lowestEmissionCategory: lowest,
          personalizedTip,
          reductionTarget: reductionProgress,
          generatedAt: new Date(),
        },
      },
      { upsert: true }
    );
  });

  await Promise.all(ops);

  return { start, end, processedUsers: results.length };
}

export async function runCurrentWeekAnalysis(
  userId?: mongoose.Types.ObjectId,
  referenceDate?: Date
) {
  const { start, end } = getCurrentWeekRange(referenceDate);

  // Aggregate activities from current week (Monday to now) per user and category
  const matchStage: any = {
    date: { $gte: start, $lt: end },
  };

  // If userId is provided, filter for specific user
  if (userId) {
    matchStage.userId = userId;
  }

  const pipeline = [
    {
      $match: matchStage,
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

  // Upsert WeeklySummary per user for current week
  const ops = results.map(async (r) => {
    const byCategoryTotals: Record<string, number> = {};
    const byCategoryCounts: Record<string, number> = {};
    for (const entry of r.byCategory) {
      byCategoryTotals[entry.k] = entry.v.total;
      byCategoryCounts[entry.k] = entry.v.count;
    }

    // Analyze emission categories
    const { highest, lowest } = analyzeEmissionCategories(
      byCategoryTotals,
      byCategoryCounts
    );

    // Calculate reduction progress (for current week analysis)
    const reductionProgress = await calculateReductionProgress(
      r._id,
      r.totalValue,
      start
    );

    // Generate personalized tip
    const personalizedTip = highest
      ? await generatePersonalizedTip(
          r._id,
          highest.category,
          start,
          end,
          reductionProgress
        )
      : null;

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
          highestEmissionCategory: highest,
          lowestEmissionCategory: lowest,
          personalizedTip,
          reductionTarget: reductionProgress,
          generatedAt: new Date(),
        },
      },
      { upsert: true }
    );
  });

  await Promise.all(ops);

  return { start, end, processedUsers: results.length };
}
