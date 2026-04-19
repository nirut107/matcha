import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  console.log(process.env.NEXT_PUBLIC_API_URL);
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_API_URL, {
      // path: '/socket.io/',
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });
  }

  return socket;
};
