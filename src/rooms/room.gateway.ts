import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service';

@WebSocketGateway({ cors: true })
export class RoomGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly authService: AuthService) {}

  // roomId => list of participants { userId, userName, role }
  private rooms: Record<string, { userId: string; userName: string; role: 'host' | 'client' }[]> = {};
  // userId => socketId
  private userSockets: Record<string, string> = {};

  handleConnection(client: Socket) {
    console.log('Client connected', client.id);
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected', client.id);
    for (const roomId in this.rooms) {
      this.rooms[roomId] = this.rooms[roomId].filter(
        (participant) => this.userSockets[participant.userId] !== client.id,
      );
      // Broadcast updated participants list (full info)
      this.server.to(roomId).emit('participantsUpdate', {
        participants: this.rooms[roomId],
      });
    }
    for (const userId in this.userSockets) {
      if (this.userSockets[userId] === client.id) {
        delete this.userSockets[userId];
      }
    }
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    client: Socket,
    payload: { roomId: string; userId: string; userName: string },
  ) {
    console.log('Received joinRoom payload:', payload); // Debug log
  let userName = payload.userName;
  let userInfo: any = null;
    if (!userName || userName.trim() === '') {
      try {
        userInfo = await this.authService['userModel'].findById(payload.userId);
        console.log('DB lookup for userId', payload.userId, 'result:', userInfo);
        if (userInfo && userInfo.userName) {
          userName = userInfo.userName;
        } else {
          console.warn('joinRoom called with missing userName and could not fetch from DB:', payload);
          userName = payload.userId; // fallback to userId
        }
      } catch (err) {
        console.warn('Error fetching userName from DB:', err);
        userName = payload.userId; // fallback to userId
      }
    } else {
      // Optionally fetch full user info if you want more fields
      try {
        userInfo = await this.authService['userModel'].findById(payload.userId);
      } catch (err) {
        userInfo = null;
      }
    }
    if (!this.rooms[payload.roomId]) this.rooms[payload.roomId] = [];
    if (!this.rooms[payload.roomId].some((p) => p.userId === payload.userId)) {
      // First user is host, others are client
      const role = this.rooms[payload.roomId].length === 0 ? 'host' : 'client';
      this.rooms[payload.roomId].push({
        userId: payload.userId,
        userName,
        role,
      });
    }
    this.userSockets[payload.userId] = client.id;
    client.join(payload.roomId);
    this.server
      .to(payload.roomId)
      .emit('userJoined', { userId: payload.userId });
    // Broadcast updated participants list (full info)
    this.server.to(payload.roomId).emit('participantsUpdate', {
      participants: this.rooms[payload.roomId],
    });
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(client: Socket, payload: { roomId: string; userId: string }) {
    if (this.rooms[payload.roomId]) {
      this.rooms[payload.roomId] = this.rooms[payload.roomId].filter(
        (p) => p.userId !== payload.userId,
      );
      client.leave(payload.roomId);
      // Broadcast updated participants list (full info)
      this.server.to(payload.roomId).emit('participantsUpdate', {
        participants: this.rooms[payload.roomId],
      });
    }
    delete this.userSockets[payload.userId];
  }

  @SubscribeMessage('codeChange')
  handleCodeChange(client: Socket, payload: { roomId: string; code: string }) {
    client.to(payload.roomId).emit('codeUpdate', { code: payload.code });
  }

  @SubscribeMessage('sendMessage')
  handleMessage(
    client: Socket,
    payload: { roomId: string; message: string; user: any },
  ) {
    this.server.to(payload.roomId).emit('newMessage', payload);
  }

  @SubscribeMessage('sendDirectMessage')
  handleDirectMessage(
    client: Socket,
    payload: { roomId: string; to: string; message: string; user: any }
  ) {
    // Find recipient socketId
    const recipientSocketId = this.userSockets[payload.to];
    if (recipientSocketId) {
      this.server.to(recipientSocketId).emit('directMessage', payload);
      // Optionally, also emit to sender
      client.emit('directMessage', payload);
    }
  }
}
