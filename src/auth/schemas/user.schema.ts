import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;
@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  userName: string;
  @Prop({ required: true })
  name: string;
  @Prop({ required: true })
  phone: number;
  @Prop({ required: true, unique: true, index: true })
  email: string;
  @Prop({ required: true })
  password: string;
  @Prop({ enum: ['admin', 'vendor', 'customer'], default: 'customer' })
  role: string;
}
export const UserSchema = SchemaFactory.createForClass(User);
