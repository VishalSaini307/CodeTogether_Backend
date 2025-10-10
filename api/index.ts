import 'source-map-support/register';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import serverless from 'serverless-http';
import express from 'express';
import { AppModule } from '../src/app.module';

let server: any = null;

async function bootstrapServer() {
  if (!server) return server;
  const expressApp = express();
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressApp),
  );
  app.enableCors({
    origin: 'http://localhost:3000',
    Credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowheaders:
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
