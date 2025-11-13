// api/index.ts

import 'source-map-support/register';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import serverless from 'serverless-http';
import { AppModule } from '../src/app.module';

let cachedNestApp: any = null;
let cachedServerHandler: any = null;

/**
 * Fix for MongoDB + NestJS cold-start
 * Ensures the event loop does not wait for open handles
 */
export const config = {
  api: {
    bodyParser: false,
  },
};

async function bootstrapNest() {
  if (cachedServerHandler) {
    return cachedServerHandler;
  }

  const expressApp = express();
  const adapter = new ExpressAdapter(expressApp);

  const app = await NestFactory.create(AppModule, adapter, {
    logger: ['error', 'warn'],
  });

  // Allow Vercel cold starts
  (app as any).getHttpAdapter().getInstance().set('callbackWaitsForEmptyEventLoop', false);

  app.enableCors({
    origin: '*',
  });

  await app.init();

  cachedNestApp = app;
  cachedServerHandler = serverless(expressApp);

  return cachedServerHandler;
}

export default async function handler(req, res) {
  try {
    const server = await bootstrapNest();
    return server(req, res);
  } catch (err) {
    console.error('❌ Handler Error:', err);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: err.message }));
  }
}
