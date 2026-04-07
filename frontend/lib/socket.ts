import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URLL;
  if (!socket) {
    socket = io(baseUrl, {
      withCredentials: true, // 🔥 VERY IMPORTANT (cookies for JWT)
      transports: ["websocket"], // optional but faster
    });
  }

  return socket;
};
