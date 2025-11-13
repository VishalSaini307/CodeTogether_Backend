import { MongooseModule } from '@nestjs/mongoose';

export const MongoConfig = MongooseModule.forRootAsync({
  useFactory: async () => {
    return {
      uri: process.env.MONGO_URI,
      serverSelectionTimeoutMS: 3000,
    };
  },
});
