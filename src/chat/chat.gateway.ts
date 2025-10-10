import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

@WebSocketGateway()
export class ChatGateway {
  // Map userName to socketId for direct messaging
  private userSocketMap: Map<string, string> = new Map();
  @WebSocketServer()
  server: Server;

  constructor(private readonly chatService: ChatService) {}

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() data: { roomId: string; message: string; user: { id: string; name: string } },
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId, message, user } = data;
    // Save to DB
    await this.chatService.createMessage(roomId, user.id, user.name, message);
    // Broadcast to room
    this.server.to(roomId).emit('newMessage', { user: { name: user.name }, message });
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(@MessageBody() data: { roomId: string; userId?: string; userName?: string }, @ConnectedSocket() client: Socket) {
    client.join(data.roomId);
    // Save userName to socketId mapping for direct messaging
    if (data.userName) {
      this.userSocketMap.set(data.userName, client.id);
    }
  }
  @SubscribeMessage('sendDirectMessage')
  async handleSendDirectMessage(
    @MessageBody() data: { roomId: string; to: string; message: string; user: { id: string; name: string } },
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId, to, message, user } = data;
    // Save to DB as a normal message (optional: add isDirect flag)
    await this.chatService.createMessage(roomId, user.id, user.name, message);
    // Find recipient socketId
    const recipientSocketId = this.userSocketMap.get(to);
    if (recipientSocketId) {
      // Send only to recipient
      this.server.to(recipientSocketId).emit('directMessage', { user: { name: user.name }, message });
      // Optionally, also send to sender for their own chat window
      client.emit('directMessage', { user: { name: user.name }, message });
    }
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(@MessageBody() data: { roomId: string }, @ConnectedSocket() client: Socket) {
    client.leave(data.roomId);
  }
}
