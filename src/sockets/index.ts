import { activitySockets } from "./acivity";

export const registerSockets = (io: any, socket: any) => {
  io.on("connection", (socket: any) => {
    console.log("New client connected: ", socket.id);
    activitySockets(io, socket);
  });
};
