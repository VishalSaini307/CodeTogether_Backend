import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ChatService } from './chat.service';
import { Delete, Param } from '@nestjs/common';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}
  @Delete('messages/:roomId')
  async deleteRoomMessages(@Param('roomId') roomId: string) {
    await this.chatService.deleteMessages(roomId);
    return { success: true };
  }

  @Get('messages')
  async getMessages(@Query('roomId') roomId: string) {
    return this.chatService.getMessages(roomId);
  }

  @Post('send')
  async sendMessage(
    @Body('roomId') roomId: string,
    @Body('userId') userId: string,
    @Body('userName') userName: string,
    @Body('message') message: string,
  ) {
    return this.chatService.createMessage(roomId, userId, userName, message);
  }
}
