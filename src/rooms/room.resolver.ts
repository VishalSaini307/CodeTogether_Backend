import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { RoomService } from './room.service';
import { RoomType } from './dto/room.type';
import { CreateRoomInput } from './dto/create-room.input';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/jwt.strategy';

@Resolver(() => RoomType)
export class RoomResolver {
  @Mutation(() => RoomType)
  @UseGuards(GqlAuthGuard)
  async joinRoomWithCode(
    @Args('roomId') roomId: string,
    @Args('inviteCode') inviteCode: string,
    @Context('req') req: any,
  ) {
    return this.roomService.joinRoomWithCode(roomId, inviteCode, req.user._id);
  }
  constructor(private readonly roomService: RoomService) {}

  @Query(() => [RoomType])
  @UseGuards(GqlAuthGuard)
  async rooms(@Context('req') req: any) {
    return this.roomService.getRoomsForUser(req.user);
  }

  @Query(() => RoomType)
  @UseGuards(GqlAuthGuard)
  async room(@Args('id') id: string, @Context('req') req: any) {
    return this.roomService.getRoomDetails(req.user, id);
  }

  @Mutation(() => RoomType)
  @UseGuards(GqlAuthGuard)
  async createRoom(
    @Args('input') input: CreateRoomInput,
    @Context('req') req: any,
  ) {
    return this.roomService.createRoom(req.user, input);
  }

  @Mutation(() => RoomType)
  @UseGuards(GqlAuthGuard)
  async updateRoom(
    @Args('roomId') roomId: string,
    @Args('input') input: CreateRoomInput,
    @Context('req') req: any,
  ) {
    return this.roomService.updateRoom(req.user, roomId, input);
  }

  @Mutation(() => String)
  @UseGuards(GqlAuthGuard)
  async deleteRoom(@Args('roomId') roomId: string, @Context('req') req: any) {
    const result = await this.roomService.deleteRoom(req.user, roomId);
    return result.message;
  }
}
