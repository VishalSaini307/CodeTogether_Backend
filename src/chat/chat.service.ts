import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChatMessage } from './chat.schema';

@Injectable()
export class ChatService {
  async deleteMessages(roomId: string) {
    return this.chatModel.deleteMany({ roomId });
  }
  constructor(
    @InjectModel(ChatMessage.name) private chatModel: Model<ChatMessage>,
  ) {}

  async createMessage(roomId: string, userId: string, userName: string, message: string) {
    const chatMsg = new this.chatModel({ roomId, userId, userName, message });
    return chatMsg.save();
  }

  async getMessages(roomId: string, limit = 50) {
    return this.chatModel.find({ roomId }).sort({ createdAt: -1 }).limit(limit).exec();
  }
}
