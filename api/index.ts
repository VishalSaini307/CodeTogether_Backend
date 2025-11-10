// api/index.ts

import 'source-map-support/register';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';
import express from 'express';
import serverless from 'serverless-http';

// Cache the server across cold starts to avoid long boot times
let cachedServer: any = null;

async function bootstrapServer() {
  if (cachedServer) return cachedServer;

  // ✅ Create plain Express app (no Proxy, no router hack)
  const expressApp = express();
  const adapter = new ExpressAdapter(expressApp);

  // ✅ Create Nest app
  const app = await NestFactory.create(AppModule, adapter, {
    logger: ['error', 'warn', 'log'],
  });

  // ✅ CORS setup for local + Vercel frontend
  app.enableCors({
    origin: [
      'http://localhost:5000',
      'https://code-together-frontend.vercel.app',
    ],
    credentials: true,
  });

  // ✅ Initialize NestJS fully before wrapping
  await app.init();

  // ✅ Cache the serverless handler (critical for Vercel cold starts)
  cachedServer = serverless(expressApp);
  return cachedServer;
}

// ✅ Vercel Function entry point
export default async function handler(req: any, res: any) {
  try {
    const url = req?.url || req?.originalUrl || '';

    // 🩺 Quick health-check route (no Nest boot)
    if (url === '/api/health' || url === '/health' || url === '/ping') {
      res.statusCode = 200;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: true, message: 'NestJS is healthy 🚀' }));
      return;
    }

    // 🖼️ Skip favicon/static requests (faster)
    const lower = url.split('?')[0].toLowerCase();
    if (
      lower.endsWith('.ico') ||
      lower.endsWith('.png') ||
      lower.endsWith('.svg') ||
      lower === '/favicon.ico' ||
      lower === '/favicon.png'
    ) {
      res.statusCode = 204;
      res.setHeader('cache-control', 'public, max-age=86400');
      res.end();
      return;
    }

    // 🧠 Boot (or reuse cached) NestJS server
    const server = await bootstrapServer();
    return server(req, res);
  } catch (err) {
    console.error('❌ Serverless handler error:', err);
    res.statusCode = 500;
    res.setHeader('content-type', 'application/json');
    res.end(
      JSON.stringify({
        message: 'Internal Server Error',
        error: err?.message || err,
      }),
    );
  }
}
