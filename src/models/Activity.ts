import mongoose from "mongoose";
import { activityData, ActivityData } from "../utils/activity-data";

type Category = keyof typeof activityData;
type Activity<C extends Category> = keyof (typeof activityData)[C];

interface ActivityDoc {
  userId: mongoose.Types.ObjectId;
  category: Category;
  activity: Activity<Category>;
  value: number;
}

const categoryEnum = Object.keys(activityData);
const activityEnums: { [key: string]: string[] } = {};
for (const category of categoryEnum) {
  activityEnums[category as Category] = Object.keys(activityData[category]);
}

const activitySchema: mongoose.Schema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      required: true,
    },
    category: {
      type: String,
      enum: categoryEnum,
      required: true,
    },
    activity: {
      type: String,
      required: true,
      validate: {
        validator: function (this: any, value: string): boolean {
          return activityEnums[this.category]?.includes(value);
        },
        message: (props: any): string =>
          `${props.value} is not a valid activity for category ${props.instance.category}`,
      },
    },
    value: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { collection: "activities" }
);

// auto-fill `value` from activityData
activitySchema.pre("validate", function (next) {
  const category = this.category as Category;
  const activity = this
    .activity as keyof (typeof activityData)[typeof category];

  const correctValue = activityData[category]?.[activity];
  if (correctValue === undefined) {
    return next(
      new Error(
        `Activity "${this.activity}" not found in category "${this.category}"`
      )
    );
  }

  this.value = correctValue;
  next();
});

export const Activity = mongoose.model<ActivityDoc>("Activity", activitySchema);
