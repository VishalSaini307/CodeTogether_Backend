import 'source-map-support/register';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import serverless from 'serverless-http';
import express from 'express';
import { AppModule } from '../src/app.module';

let server: any = null;

async function bootstrapServer() {
  if (server) return server; // return cached handler when already initialized

  const expressApp = express();
  // Log express version to make runtime mismatches visible in Vercel logs
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const expressPkg = require('express/package.json');
    console.log('Express version:', expressPkg.version);
  } catch (e) {
    console.warn('Failed to read express version:', e && (e.stack ?? e));
  }
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressApp),
  );
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders:
      'Origin, X-Requested-With, Content-Type, Accept, Authorization',
  });
  await app.init();
  server = serverless(expressApp);
  return server;
}

export default async function handler(req: any, res: any) {
  const s = await bootstrapServer();
  return s(req, res);
}
