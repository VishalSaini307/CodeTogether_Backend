import { Resolver, Mutation, Args, Query } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { UserType } from './schemas/user.type';
import { RegisterInput } from './schemas/register.input';
import { LoginResponse } from './schemas/login.response';
import { LoginInput } from './schemas/login.input';
import { ApolloError } from 'apollo-server-express';

@Resolver(() => UserType)
export class AuthResolver {
  constructor(private authService: AuthService) {}

  @Query(() => String)
  hello() {
    return 'Hello World!';
  }

  @Mutation(() => UserType)
  async register(@Args('input') input: RegisterInput) {
    try {
      const user = await this.authService.register(input);
      type UserObj = {
        _id?: { toString?: () => string } | string;
        userName?: string;
        name?: string;
        phone?: number; // phone is number in schema
        email?: string;
        role?: string;
      };
      const obj: UserObj = user.toObject ? (user.toObject() as UserObj) : (user as unknown as UserObj);
      return {
        _id: typeof obj._id === 'string'
          ? obj._id
          : (obj._id && typeof obj._id.toString === 'function'
              ? obj._id.toString()
              : undefined),
        userName: obj.userName,
        name: obj.name,
        phone: obj.phone,
        email: obj.email,
        role: obj.role,
      };
    } catch (error: any) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      if (error.message && error.message.includes('already exists')) {
        throw new ApolloError(
          'User with this email or phone already exists',
          'DUPLICATE_USER',
        );
      }
      throw error;
    }
  }
  @Mutation(() => LoginResponse)
  async login(@Args('input', { type: () => LoginInput }) input: LoginInput) {
    const user = await this.authService.getUserByEmail(input.email);
    if (!user) throw new ApolloError('User not found', 'USER_NOT_FOUND');
    const obj: Record<string, any> = user.toObject ? user.toObject() : user;
    if (!obj) throw new ApolloError('User object is null', 'USER_OBJECT_NULL');
    const isPasswordValid = await this.authService.validatePassword(
      input.password,
      obj.password,
    );
    if (!isPasswordValid)
      throw new ApolloError('Invalid password', 'INVALID_PASSWORD');
  const token = this.authService.generateToken(user);
    return {
      token,
      user: {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        _id: typeof obj._id === 'string' ? obj._id : obj._id?.toString?.(),
        userName: obj.userName,
        name: obj.name,
        phone: obj.phone,
        email: obj.email,
        role: obj.role,
      },
    };
  }
}
