import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

import { User, UserDocument } from './schemas/user.schema';
import { RegisterInput } from './schemas/register.input';

@Injectable()
export class AuthService {
  async validatePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  generateToken(user: UserDocument): string {
    return jwt.sign(
      { sub: user._id, email: user.email, name: user.name }, // include name
      process.env.JWT_SECRET!,
      { expiresIn: '1h' },
    );
  }
  async getUserByEmail(email: string) {
    return this.userModel.findOne({ email });
  }
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async register(input: RegisterInput) {
    // Check for duplicate email or phone
    const existingUser = await this.userModel.findOne({
      $or: [{ email: input.email }, { phone: input.phone }],
    });
    if (existingUser) {
      // ApolloError import is in resolver, so use a generic Error here
      throw new Error('User with this email or phone already exists');
    }
    const hashedPassword = await bcrypt.hash(input.password, 10);
    const user: UserDocument = new this.userModel({
      userName: input.userName,
      name: input.name,
      phone: input.phone,
      email: input.email,
      password: hashedPassword,
      role: input.role,
    });
    const savedUser = await user.save();
    return savedUser;
  }
  async login(email: string, password: string) {
    console.log('Login payload received:', { email, password });
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new Error('User not found');
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid password');
    }
    return new Promise((resolve, reject) => {
      jwt.sign(
        { sub: user._id, email: user.email },
        process.env.JWT_SECRET!,
        { expiresIn: '1h' },
        (err, token) => {
          if (err) reject(err);
          resolve(token);
        },
      );
    });
  }
}
