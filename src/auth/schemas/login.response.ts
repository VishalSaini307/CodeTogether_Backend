import { ObjectType, Field } from '@nestjs/graphql';
import { UserType } from './user.type';

@ObjectType()
export class LoginResponse {
  @Field()
  token: string;

  @Field(() => UserType)
  user: UserType;
}