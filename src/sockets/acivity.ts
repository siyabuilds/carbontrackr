import { formatTipResponse } from "../utils/tip";
import { Server, Socket } from "socket.io";

interface CustomSocket extends Socket {
  userId?: string;
}

export const activitySockets = (io: Server, socket: CustomSocket) => {
  socket.on("register-user", (userId: string) => {
    socket.join(userId);
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
      const tipResponse = formatTipResponse(category, activity, userId);
      if (tipResponse) {
        io.to(userId).emit("tip-response", tipResponse);
      }
    }
  );
};
