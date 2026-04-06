import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
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
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<number, Set<string>>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly db: DatabaseService,
  ) {}

  // ========================
  // 🔐 AUTH ON CONNECT
  // ========================
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

      socket.data.userId = userId;

      let sockets = this.userSockets.get(userId);
      if (!sockets) {
        sockets = new Set();
        this.userSockets.set(userId, sockets);
      }
      sockets.add(socket.id);

      console.log(`✅ User ${userId} connected`);
    } catch {
      socket.disconnect();
    }
  }

  handleDisconnect(socket: Socket) {
    const userId = socket.data.userId;

    if (!userId) return;

    const sockets = this.userSockets.get(userId);
    if (!sockets) return;

    sockets.delete(socket.id);

    if (sockets.size === 0) {
      this.userSockets.delete(userId);
    }

    console.log(`❌ User ${userId} disconnected`);
  }

  // ========================
  // 🏠 JOIN ROOM
  // ========================
  @SubscribeMessage('joinMatch')
  async joinMatch(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { matchId: number },
  ) {
    const userId = socket.data.userId;
    console.log('joinchat', data.matchId);
    const valid = await this.isUserInMatch(userId, data.matchId);
    if (!valid) return;

    socket.join(`match_${data.matchId}`);

    console.log(`👥 User ${userId} joined match ${data.matchId}`);
  }

  // ========================
  // 🚪 LEAVE ROOM
  // ========================
  @SubscribeMessage('leaveMatch')
  async leaveMatch(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { matchId: number },
  ) {
    socket.leave(`match_${data.matchId}`);
  }

  // ========================
  // 💬 SEND MESSAGE
  // ========================
  // ========================
  // 💬 SEND MESSAGE
  // ========================
  @SubscribeMessage('sendMessage')
  async sendMessage(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { matchId: number; content: string },
  ) {
    const userId = socket.data.userId;

    const matchResult = await this.db.query(
      `SELECT user1_id, user2_id FROM matches WHERE id = $1`,
      [data.matchId],
    );

    if (matchResult.rows.length === 0) return;
    const match = matchResult.rows[0];
    const isMember = match.user1_id === userId || match.user2_id === userId;
    if (!isMember) return;

    const result = await this.db.query(
      `INSERT INTO messages (match_id, sender_id, content)
     VALUES ($1, $2, $3)
     RETURNING *`,
      [data.matchId, userId, data.content],
    );
    const message = result.rows[0];

    const roomName = `match_${data.matchId}`;
    this.server.to(roomName).emit('newMessage', message);

    const recipientId =
      match.user1_id === userId ? match.user2_id : match.user1_id;

    const room = this.server.sockets.adapter.rooms.get(`match_${data.matchId}`);
    const recipientSockets = this.userSockets.get(recipientId);

    let isRecipientInRoom = false;
    if (recipientSockets && room) {
      for (const sId of recipientSockets) {
        if (room.has(sId)) {
          isRecipientInRoom = true;
          break;
        }
      }
    }
    console.log(isRecipientInRoom, "not on room")
    if (!isRecipientInRoom) {
      this.sendToUser(recipientId, {
        type: 'NEW_MESSAGE',
        matchId: data.matchId,
        senderId: userId,
        text: data.content,
      });
    }
  }

  // ========================
  // 🔔 NOTIFICATION HELPER
  // ========================
  sendToUser(userId: number, notification: any) {
    const sockets = this.userSockets.get(userId);
    if (!sockets) return;

    for (const socketId of sockets) {
      this.server.to(socketId).emit('notification', notification);
    }
  }

  // ========================
  // 🔧 HELPERS
  // ========================
  private extractToken(cookieHeader: string): string | null {
    const cookies = cookieHeader.split(';').map((c) => c.trim());

    for (const c of cookies) {
      if (c.startsWith('access_token=')) {
        return c.split('=')[1];
      }
    }
    return null;
  }

  private async isUserInMatch(userId: number, matchId: number) {
    const result = await this.db.query(
      `
        SELECT * FROM matches
        WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)
        `,
      [matchId, userId],
    );

    return result.rows.length > 0;
  }
}
