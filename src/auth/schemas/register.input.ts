import { InputType, Field, ID } from '@nestjs/graphql';

@InputType()
export class RegisterInput {
  @Field(() => ID, { nullable: true })
  _id?: string; // MongoDB ObjectId as string (optional for creation)

  @Field()
  userName: string;

  @Field()
  name: string;

  @Field()
  phone: string;

  @Field()
  email: string;

  @Field()
  password: string;

  @Field()
  role: string;
}
