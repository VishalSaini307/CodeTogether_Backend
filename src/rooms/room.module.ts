import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RoomService } from './room.service';
import { RoomResolver } from './room.resolver';
import { Room, RoomSchema } from './dto/room.schema';
import { JwtStrategy } from '../auth/jwt.strategy';
import { RoomGateway } from './room.gateway';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Room.name, schema: RoomSchema }]),
    AuthModule,
  ],
  providers: [RoomService, RoomResolver, JwtStrategy, RoomGateway],
  exports: [RoomGateway],
})
export class RoomModule {}
