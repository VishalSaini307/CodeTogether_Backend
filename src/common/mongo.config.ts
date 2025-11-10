import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';

export const DataBaseModule = MongooseModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: (configService: ConfigService) => ({
    uri: configService.get<string>('MONGO_URI'),
    dbName: 'Codetogether',

    // ✅ Fail fast on cold starts instead of hanging
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
    socketTimeoutMS: 45000,

    // ✅ Disable autoIndex to reduce startup cost
    autoIndex: false,

    // ✅ Prevent Mongoose from reconnect loops during serverless re-invocations
    family: 4, // Force IPv4 (faster resolution on Vercel)
    maxPoolSize: 3, // Small pool for Lambda
    minPoolSize: 1,

    // ✅ Optional but recommended
    retryWrites: true,
    w: 'majority',
  }),
  inject: [ConfigService],
});
