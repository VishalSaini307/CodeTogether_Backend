import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Room, RoomDocument } from './dto/room.schema';
import { CreateRoomInput } from './dto/create-room.input';

@Injectable()
export class RoomService {
  constructor(@InjectModel(Room.name) private roomModel: Model<RoomDocument>) {}

  // ...existing imports...
  /**
   * Join a room by ID and invite code
   */
  async joinRoomWithCode(roomId: string, inviteCode: string, userId: string) {
    if (!Types.ObjectId.isValid(roomId)) {
      throw new BadRequestException('Invalid room ID');
    }
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }
    const room = await this.roomModel.findById(roomId);
    if (!room) throw new NotFoundException('Room not found');
    if (room.code !== inviteCode) {
      throw new ForbiddenException('Invalid invite code');
    }
    const userObjectId = new Types.ObjectId(userId);
    if (room.participants.some((p) => p.equals(userObjectId))) {
      return room;
    }
    room.participants.push(userObjectId);
    await room.save();
    return room;
  }

  /**
   * Create a new room
   */
async createRoom(user: { _id: string }, body: CreateRoomInput) {
  if (!user || !user._id) {
    throw new BadRequestException('User not found or not authenticated');
  }

  // Generate a random code if not provided
  const code = body.code && body.code.trim() ? body.code : Math.random().toString(36).substring(2, 8).toUpperCase();

  const room = new this.roomModel({
    name: body.name,
    owner: new Types.ObjectId(user._id),
    participants: [new Types.ObjectId(user._id)],
    code,
    description: body.description || '',
  });

  return room.save();
}

  /**
   * Join a room by ID
   */
  async joinRoom(roomId: string, userId: string) {
    if (!Types.ObjectId.isValid(roomId)) {
      throw new BadRequestException('Invalid room ID');
    }
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const room = await this.roomModel.findById(roomId);
    if (!room) throw new NotFoundException('Room not found');

    const userObjectId = new Types.ObjectId(userId);

    // prevent duplicate join
    if (room.participants.some((p) => p.equals(userObjectId))) {
      return room;
    }

    room.participants.push(userObjectId);
    await room.save();
    return room;
  }

  /**
   * Get all rooms where user is a participant
   */
  async getRoomsForUser(user: { _id: string }) {
    if (!user || !user._id) {
      throw new BadRequestException('User not authenticated');
    }

    const userObjectId = new Types.ObjectId(user._id);
    return this.roomModel.find({ participants: userObjectId }).exec();
  }

  /**
   * Get details of a single room (only if user is a participant)
   */
  async getRoomDetails(user: { _id: string }, id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid room ID');
    }

    const room = await this.roomModel.findById(id).exec();
    if (!room) throw new NotFoundException('Room not found');

    const userObjectId = new Types.ObjectId(user._id);
    // Allow access if user is owner or participant
    if (
      !room.participants.some((p) => p.equals(userObjectId)) &&
      !room.owner.equals(userObjectId)
    ) {
      throw new ForbiddenException('You are not allowed to view this room');
    }

    return room;
  }

  /**
   * Update a room (only owner can update)
   */
  async updateRoom(
    user: { _id: string },
    roomId: string,
    updateData: Partial<CreateRoomInput>,
  ) {
    if (!Types.ObjectId.isValid(roomId)) {
      throw new BadRequestException('Invalid room ID');
    }

    const room = await this.roomModel.findById(roomId).exec();
    if (!room) throw new NotFoundException('Room not found');

    if (!room.owner.equals(user._id)) {
      throw new ForbiddenException('Only the room owner can update this room');
    }

    if (updateData.name) room.name = updateData.name;
    if (updateData.description) room.description = updateData.description;
    if (updateData.code) room.code = updateData.code;

    return room.save();
  }

  /**
   * Delete a room (only owner can delete)
   */
  async deleteRoom(user: { _id: string }, roomId: string) {
    if (!Types.ObjectId.isValid(roomId)) {
      throw new BadRequestException('Invalid room ID');
    }

    const room = await this.roomModel.findById(roomId).exec();
    if (!room) throw new NotFoundException('Room not found');

    if (!room.owner.equals(user._id)) {
      throw new ForbiddenException('Only the room owner can delete this room');
    }

    await room.deleteOne();
    return { message: 'Room deleted successfully' };
  }
}
