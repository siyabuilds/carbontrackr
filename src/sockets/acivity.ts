import { formatTipResponse } from "../utils/tip";
import { Server, Socket } from "socket.io";

interface CustomSocket extends Socket {
  userId?: string;
}

export const activitySockets = (io: Server, socket: CustomSocket) => {
  socket.on("register-user", (userId: string) => {
    if (!userId || typeof userId !== "string") {
      socket.emit("error", { message: "Invalid user ID" });
      return;
    }
    socket.join(userId);
    console.log(`User ${userId} joined room`);
  });

  socket.on(
    "activity-logged",
    ({
      userId,
      category,
      activity,
    }: {
      userId: string;
      category: string;
      activity: string;
    }) => {
      console.log(
        `Activity logged: ${category} - ${activity} for user ${userId}`
      );
      const tipResponse = formatTipResponse(category, activity, userId);
      io.to(userId).emit("tip-response", tipResponse);
    }
  );
};
