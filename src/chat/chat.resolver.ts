import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { ChatService } from './chat.service';
import { ChatMessage } from './chat.schema';

@Resolver(() => ChatMessage)
export class ChatResolver {
  constructor(private readonly chatService: ChatService) {}

  @Query(() => [ChatMessage])
  async chatMessages(@Args('roomId') roomId: string) {
    return this.chatService.getMessages(roomId);
  }

  @Mutation(() => ChatMessage)
  async sendChatMessage(
    @Args('roomId') roomId: string,
    @Args('userId') userId: string,
    @Args('userName') userName: string,
    @Args('message') message: string,
  ) {
    return this.chatService.createMessage(roomId, userId, userName, message);
  }
}
