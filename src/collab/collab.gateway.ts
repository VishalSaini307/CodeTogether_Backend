import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true })
export class CollabGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private rooms: Record<string, string[]> = {};
  private userSockets: Record<string, string> = {};
  private roomCodes: Record<string, string> = {}; // Store code per room

  handleConnection(client: Socket) {
    // Client connected
  }

  handleDisconnect(client: Socket) {
    // Remove user from rooms
    for (const roomId in this.rooms) {
      this.rooms[roomId] = this.rooms[roomId].filter(
        (userId) => this.userSockets[userId] !== (client as any).id,
      );
      (this.server as any).to(roomId).emit('participantsUpdate', {
        participants: this.rooms[roomId],
      });
    }
    for (const userId in this.userSockets) {
      if (this.userSockets[userId] === (client as any).id) {
        delete this.userSockets[userId];
      }
    }
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(client: Socket, payload: { roomId: string; userId: string }) {
    if (!this.rooms[payload.roomId]) this.rooms[payload.roomId] = [];
    if (!this.rooms[payload.roomId].includes(payload.userId)) {
      this.rooms[payload.roomId].push(payload.userId);
    }
  this.userSockets[payload.userId] = (client as any).id;
  (client as any).join(payload.roomId);
    // Send current code to the new user
    const currentCode = this.roomCodes[payload.roomId] || '';
  (client as any).emit('codeUpdate', { code: currentCode });
    (this.server as any)
      .to(payload.roomId)
      .emit('userJoined', { userId: payload.userId });
    (this.server as any).to(payload.roomId).emit('participantsUpdate', {
      participants: this.rooms[payload.roomId],
    });
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(client: Socket, payload: { roomId: string; userId: string }) {
    if (this.rooms[payload.roomId]) {
      this.rooms[payload.roomId] = this.rooms[payload.roomId].filter(
        (userId) => userId !== payload.userId,
      );
      (client as any).leave(payload.roomId);
      (this.server as any).to(payload.roomId).emit('participantsUpdate', {
        participants: this.rooms[payload.roomId],
      });
    }
    delete this.userSockets[payload.userId];
  }

  @SubscribeMessage('codeChange')
  handleCodeChange(client: Socket, payload: { roomId: string; code: string }) {
    this.roomCodes[payload.roomId] = payload.code; // Save code for room
  (client as any).to(payload.roomId).emit('codeUpdate', { code: payload.code });
  }

  @SubscribeMessage('sendMessage')
  handleMessage(
    client: Socket,
    payload: { roomId: string; message: string; user: any },
  ) {
  (this.server as any).to(payload.roomId).emit('newMessage', payload);
  }
}
