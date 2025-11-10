import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';

export const DataBaseModule = MongooseModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: (configService: ConfigService) => ({
    uri: configService.get<string>('MONGO_URI'),
    dbName: 'Codetogether',
    // Reduce server selection/connect time so cold-starts fail fast instead of
    // hanging the serverless function for a long time.
    // These options are safe defaults for serverless environments.
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    // Use the newer unified topology (default in modern mongoose)
    // and avoid building indexes on cold starts.
    autoIndex: false,
  }),
  inject: [ConfigService],
});
