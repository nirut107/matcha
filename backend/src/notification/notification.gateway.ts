import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ac } from 'node_modules/@faker-js/faker/dist/airline-eVQV6kbz';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:3000',
    credentials: true,
  },
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(private readonly jwtService: JwtService) {}

  private extractTokenFromCookie(cookieHeader: string): string | null {
    const cookies = cookieHeader.split(';').map((c) => c.trim());

    for (const cookie of cookies) {
      if (cookie.startsWith('access_token=')) {
        return cookie.split('=')[1];
      }
    }

    return null;
  }
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<number, Set<string>>();

  handleConnection(socket: Socket) {
    try {
      const cookies = socket.handshake.headers.cookie;
      if (!cookies) return socket.disconnect();

      const token = this.extractToken(cookies);
      if (!token) return socket.disconnect();

      const payload = this.jwtService.verify<{ sub: number }>(token, {
        secret: process.env.JWT_ACCESS_SECRET,
      });

      const userId = payload.sub;
      console.log('conect noti', userId);
      let sockets = this.userSockets.get(userId);

      if (!sockets) {
        sockets = new Set();
        this.userSockets.set(userId, sockets);
      }

      sockets.add(socket.id);
    } catch {
      socket.disconnect();
    }
  }

  private extractToken(cookieHeader: string): string | null {
    const cookies = cookieHeader.split(';').map((c) => c.trim());

    for (const c of cookies) {
      if (c.startsWith('access_token=')) {
        return c.split('=')[1];
      }
    }
    return null;
  }

  handleDisconnect(socket: Socket) {
    for (const [userId, sockets] of this.userSockets.entries()) {
      sockets.delete(socket.id);

      if (sockets.size === 0) {
        this.userSockets.delete(userId);
      }
    }
  }

  sendToUser(userId: number, notification: any) {
    const sockets = this.userSockets.get(userId);
    console.log('sentToUser', userId);
    if (!sockets) return;

    for (const socketId of sockets) {
      this.server.to(socketId).emit('notification', notification);
    }
  }

  @SubscribeMessage('whoami')
  handleWhoAmI(@ConnectedSocket() socket: Socket) {
    const userId = socket.data.userId;
    console.log('whoami');
    socket.emit('me', {
      userId,
    });
  }
}
