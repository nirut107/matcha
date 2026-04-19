// socket.registry.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class SocketRegistry {
  private userSockets = new Map<number, Set<string>>();

  add(userId: number, socketId: string): boolean {
    let sockets = this.userSockets.get(userId);
    let isFirstConnection = false;

    if (!sockets) {
      sockets = new Set();
      this.userSockets.set(userId, sockets);
      isFirstConnection = true; // 🔥 same logic you like
    }

    sockets.add(socketId);

    return isFirstConnection;
  }

  remove(userId: number, socketId: string): boolean {
    const sockets = this.userSockets.get(userId);
    if (!sockets) return false;

    sockets.delete(socketId);

    if (sockets.size === 0) {
      this.userSockets.delete(userId);
      return true; // 🔥 last disconnect
    }

    return false;
  }

  get(userId: number): Set<string> | undefined {
    return this.userSockets.get(userId);
  }
}