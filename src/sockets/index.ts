import { Server, Socket } from "socket.io";
import { activitySockets } from "./acivity";

export const registerSockets = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    console.log("New client connected: ", socket.id);
    activitySockets(io, socket);
  });
};
