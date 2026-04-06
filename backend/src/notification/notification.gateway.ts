import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../database/database.service';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:3000',
    credentials: true,
  },
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private readonly jwtService: JwtService,
    private readonly db: DatabaseService,
  ) {}

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

  async handleConnection(socket: Socket) {
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
      let isFirstConnection = false;
      if (!sockets) {
        sockets = new Set();
        this.userSockets.set(userId, sockets);
        isFirstConnection = true;
      }

      sockets.add(socket.id);
      if (isFirstConnection) {
        await this.db.query(`UPDATE users SET is_online = TRUE WHERE id = $1`, [
          userId,
        ]);
        console.log(`User ${userId} is now ONLINE in DB`);
      }
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

  async handleDisconnect(socket: Socket) {
    const userId = socket.data.userId;

    if (!userId) return;

    const sockets = this.userSockets.get(userId);
    if (!sockets) return;

    sockets.delete(socket.id);

    if (sockets.size === 0) {
      this.userSockets.delete(userId);

      try {
        await this.db.query(
          `UPDATE users SET is_online = FALSE, last_connection = NOW() WHERE id = $1`,
          [userId],
        );
        console.log(`User ${userId} is now OFFLINE in DB`);
      } catch (err) {
        console.error('Failed to update offline status', err);
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

  @SubscribeMessage('rejectCall')
  handleRejectCall(
    @MessageBody() data: { toUserId: number },
    @ConnectedSocket() client: any, // Use any to access custom data properties
  ) {
    console.log("rejectCall")
    const targetId = Number(data.toUserId);

    // 2. Get the sender's ID (the person rejecting the call)
    // This depends on how you store user info on the socket during connection
    const rejectorId = client.user?.id || client.data?.userId;

    // 3. Find the original caller's socket
    const callerSocketId = this.userSockets.get(targetId);

    if (callerSocketId) {
      this.server.to([...callerSocketId]).emit('notification', {
        type: 'CALL_REJECTED',
        from: rejectorId,
        message: 'User declined the call',
      });
      console.log(`Call rejected by ${rejectorId} for caller ${targetId}`);
    } else {
      console.log(`Could not find socket for caller ${targetId}`);
    }
  }
}
