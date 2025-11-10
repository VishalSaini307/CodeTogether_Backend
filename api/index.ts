import 'source-map-support/register';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import serverless from 'serverless-http';
import { AppModule } from '../src/app.module';

// Cache the server instance between invocations (critical for Vercel)
let cachedServer: any = null;

async function bootstrapServer() {
  if (cachedServer) return cachedServer;

  const expressApp = express();
  const adapter = new ExpressAdapter(expressApp);

  const app = await NestFactory.create(AppModule, adapter, {
    logger: ['error', 'warn', 'log'],
  });

  // ✅ CORS for local + frontend
  app.enableCors({
    origin: [
      'http://localhost:5000',
      'https://code-together-frontend.vercel.app',
    ],
    credentials: true,
  });

  // ✅ Ensure full app initialization before serverless wrapping
  await app.init();

  // ✅ Cache server to avoid cold start reboots
  cachedServer = serverless(expressApp);
  return cachedServer;
}

// ✅ Exported Vercel function entrypoint
export default async function handler(req: any, res: any) {
  try {
    const url = req?.url || req?.rawUrl || req?.originalUrl || '';

    // Quick health checks (instant response, no Nest boot)
    if (url === '/api/health' || url === '/health' || url === '/ping') {
      res.statusCode = 200;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: true, timestamp: new Date().toISOString() }));
      return;
    }

    // Skip static assets to save cold-start time
    const lower = url.split('?')[0].toLowerCase();
    if (
      lower === '/favicon.ico' ||
      lower === '/favicon.png' ||
      lower.endsWith('.png') ||
      lower.endsWith('.ico') ||
      lower.endsWith('.svg')
    ) {
      res.statusCode = 204;
      res.setHeader('cache-control', 'public, max-age=86400');
      res.end();
      return;
    }

    // ✅ Initialize (or reuse cached) Nest server
    const server = await bootstrapServer();
    return server(req, res);

  } catch (err) {
    console.error('⚠️ Serverless handler error:', err);
    res.statusCode = 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ message: 'Internal Server Error', error: err.message }));
  }
}

