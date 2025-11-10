import { Resolver, Mutation, Args, Query } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { UserType } from './schemas/user.type';
import { RegisterInput } from './schemas/register.input';
import { LoginResponse } from './schemas/login.response';
import { LoginInput } from './schemas/login.input';
import { GraphQLError } from 'graphql';

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
        throw new GraphQLError('User with this email or phone already exists', {
          extensions: { code: 'DUPLICATE_USER' },
        });
      }
      throw error;
    }
  }
  @Mutation(() => LoginResponse)
  async login(@Args('input', { type: () => LoginInput }) input: LoginInput) {
    const user = await this.authService.getUserByEmail(input.email);
    if (!user)
      throw new GraphQLError('User not found', { extensions: { code: 'USER_NOT_FOUND' } });
    const obj: Record<string, any> = user.toObject ? user.toObject() : user;
    if (!obj)
      throw new GraphQLError('User object is null', { extensions: { code: 'USER_OBJECT_NULL' } });
    const isPasswordValid = await this.authService.validatePassword(
      input.password,
      obj.password,
    );
    if (!isPasswordValid)
      throw new GraphQLError('Invalid password', { extensions: { code: 'INVALID_PASSWORD' } });
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
