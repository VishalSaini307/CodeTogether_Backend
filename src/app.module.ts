import { Module } from '@nestjs/common';
import { RoomModule } from './rooms/room.module';
import { AppController } from './app.controller';
import { MongoConfig } from './common/mongo.config';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CollabModule } from './collab/collab.module';
import { GraphQLModule } from '@nestjs/graphql';
import { ConfigModule } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: './src/.env' }),
    // Only initialize the DB module when a MONGO_URI is present. In serverless
    // environments a missing or unreachable DB can cause long cold-starts and
    // 504s. This keeps functions fast and fails fast if DB is misconfigured.
  ...(process.env.MONGO_URI ? [MongoConfig] : []),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      // ✅ Generate schema in memory (Vercel safe)
      autoSchemaFile: true,

      // ✅ Context for attaching user from JWT
      context: ({ req }) => {
        const token = req.headers.authorization?.split(' ')[1]; // Bearer <token>
        if (token) {
          try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET!);
            req.user = decoded;
          } catch (err) {
            console.error('Invalid token:', err.message);
          }
        }
        return { req };
      },
    }),
    RoomModule,
    AuthModule,
    CollabModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
