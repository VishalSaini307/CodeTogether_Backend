import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class RoomType {
  @Field(() => ID)
  _id: string;

  @Field()
  name: string;

  @Field()
  owner: string;

  @Field(() => [String])
  participants: string[];

  @Field({ nullable: true })
  code?: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}