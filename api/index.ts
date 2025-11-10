import 'source-map-support/register';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import serverless from 'serverless-http';
import express from 'express';
import { AppModule } from '../src/app.module';

let cachedServer: any = null;

async function bootstrapServer() {
  if (cachedServer) return cachedServer; // ✅ reuse cached handler (improves cold start)

  const expressApp = express();

  // ✅ Create Nest app with Express adapter
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));

  // ✅ Enable CORS for your frontend (update origin for your deployed frontend domain)
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://code-together-frontend.vercel.app', // 👈 your actual frontend URL
    ],
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
  });

  await app.init();

  // ✅ Wrap NestJS with serverless handler
  cachedServer = serverless(expressApp);
  return cachedServer;
}

// ✅ This is what Vercel will call
export default async function handler(req: any, res: any) {
  const server = await bootstrapServer();
  return server(req, res);
}
