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
import { SocketRegistry } from '../socket/socket.registry';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'https://your-domain.com'],
    credentials: true,
  },
})
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly db: DatabaseService,
    private readonly registry: SocketRegistry,
  ) {}

  // ========================
  // 🔐 AUTH
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

      const isFirstConnection = this.registry.add(userId, socket.id);

      if (isFirstConnection) {
        await this.db.query(`UPDATE users SET is_online = TRUE WHERE id = $1`, [
          userId,
        ]);
        console.log(`🟢 User ${userId} is now ONLINE`);
      }

      console.log(`✅ User ${userId} connected (${socket.id})`);
    } catch {
      socket.disconnect();
    }
  }

  async handleDisconnect(socket: Socket) {
    const userId = socket.data.userId;
    if (!userId) return;

    const isLastConnection = this.registry.remove(userId, socket.id);

    if (isLastConnection) {
      await this.db.query(
        `UPDATE users SET is_online = FALSE, last_connection = NOW() WHERE id = $1`,
        [userId],
      );
      console.log(`🔴 User ${userId} is now OFFLINE`);
    }

    console.log(`❌ User ${userId} disconnected (${socket.id})`);
  }

  // ========================
  // 🔔 SEND TO USER (GLOBAL)
  // ========================
  sendToUser(userId: number, payload: any) {
    const sockets = this.registry.get(userId);
    if (!sockets) return;

    for (const socketId of sockets) {
      this.server.to(socketId).emit('notification', payload);
    }
  }

  // ========================
  // 🏠 CHAT ROOM
  // ========================
  @SubscribeMessage('joinMatch')
  async joinMatch(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { matchId: number },
  ) {
    const userId = socket.data.userId;

    const valid = await this.isUserInMatch(userId, data.matchId);
    if (!valid) return;

    socket.join(`match_${data.matchId}`);
  }

  @SubscribeMessage('leaveMatch')
  leaveMatch(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { matchId: number },
  ) {
    socket.leave(`match_${data.matchId}`);
  }

  // ========================
  // 💬 CHAT MESSAGE
  // ========================
  @SubscribeMessage('sendMessage')
  async sendMessage(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { matchId: number; content: string },
  ) {
    const userId = socket.data.userId;

    const matchRes = await this.db.query(
      `SELECT user1_id, user2_id FROM matches WHERE id = $1`,
      [data.matchId],
    );

    if (matchRes.rows.length === 0) return;

    const match = matchRes.rows[0];
    const recipientId =
      match.user1_id === userId ? match.user2_id : match.user1_id;

    const result = await this.db.query(
      `INSERT INTO messages (match_id, sender_id, content)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [data.matchId, userId, data.content],
    );

    const message = result.rows[0];

    const room = `match_${data.matchId}`;

    // send to active chat users
    socket.to(room).emit('newMessage', message);

    // check if recipient is in room
    const roomSockets = this.server.sockets.adapter.rooms.get(room);
    const recipientSockets = this.registry.get(recipientId);

    let inRoom = false;

    if (roomSockets && recipientSockets) {
      for (const sId of recipientSockets) {
        if (roomSockets.has(sId)) {
          inRoom = true;
          break;
        }
      }
    }

    // 🔥 if not in room → send notification
    if (!inRoom) {
      const senderProfile = await this.db.query(
        `SELECT first_name FROM profiles WHERE user_id = $1`,
        [userId],
      );

      this.sendToUser(recipientId, {
        type: 'NEW_MESSAGE',
        matchId: data.matchId,
        senderId: userId,
        senderName: senderProfile.rows[0]?.first_name,
        text: data.content,
      });
    }
  }

  // ========================
  // 📞 CALLS
  // ========================
  @SubscribeMessage('callUser')
  async callUser(
    @ConnectedSocket() socket: Socket,
    @MessageBody()
    data: { toUserId: number; offer: any; matchId: number; callType: string },
  ) {
    const fromUserId = socket.data.userId;

    this.sendToUser(data.toUserId, {
      type: 'INCOMING_CALL',
      from: fromUserId,
      offer: data.offer,
      matchId: data.matchId,
      callType: data.callType,
    });
  }

  @SubscribeMessage('answerCall')
  answerCall(
    @MessageBody() data: { toUserId: number; answer: any },
    @ConnectedSocket() socket: Socket,
  ) {
    const fromUserId = socket.data.userId;

    this.sendToUser(data.toUserId, {
      type: 'CALL_ANSWERED',
      from: fromUserId,
      answer: data.answer,
    });
  }

  @SubscribeMessage('endCall')
  endCall(
    @MessageBody() data: { toUserId: number },
    @ConnectedSocket() socket: Socket,
  ) {
    const fromUserId = socket.data.userId;

    this.sendToUser(data.toUserId, {
      type: 'CALL_ENDED',
      from: fromUserId,
    });
  }

  // ========================
  // HELPERS
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
      `SELECT 1 FROM matches WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)`,
      [matchId, userId],
    );
    return result.rows.length > 0;
  }
}
