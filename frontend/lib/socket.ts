import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io("http://localhost:3001", {
      withCredentials: true, // 🔥 VERY IMPORTANT (cookies for JWT)
      transports: ["websocket"], // optional but faster
    });
  }

  return socket;
};
