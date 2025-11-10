import 'source-map-support/register';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import serverless from 'serverless-http';
import { AppModule } from '../src/app.module';

let cachedServer: any = null;

async function bootstrapServer() {
  if (cachedServer) return cachedServer;

  const expressApp = express();
  // create a Proxy wrapper so reads of `router` do not trigger Express's
  // deprecated getter which emits the "'app.router' is deprecated" warning.
  const proxiedExpressApp = new Proxy(function _handler(...args: any[]) {
    return (expressApp as any).apply?.(expressApp, args);
  } as any, {
    get(_target, prop) {
      if (prop === 'router') return (expressApp as any)._router;
      const val = (expressApp as any)[prop];
      return typeof val === 'function' ? val.bind(expressApp) : val;
    },
    set(_target, prop, value) {
      (expressApp as any)[prop] = value;
      return true;
    },
    apply(_target, thisArg, args) {
      return (expressApp as any).apply?.(thisArg, args);
    },
  });

  const adapter = new ExpressAdapter(proxiedExpressApp);

  const app = await NestFactory.create(AppModule, adapter, {
    logger: ['error', 'warn', 'log'],
  });

  app.enableCors({
    origin: [
      'http://localhost:5000',
      'https://code-together-frontend.vercel.app',
    ],
    credentials: true,
  });

  await app.init();

  // Use the proxied app for the serverless handler as well so accesses
  // to `router` won't trigger Express's deprecated getter when running
  // in serverless environments.
  cachedServer = serverless(proxiedExpressApp as any);
  return cachedServer;
}

export default async function handler(req: any, res: any) {
  try {
    const url = req?.url || req?.rawUrl || req?.originalUrl || '';

    // Quick health checks (no Nest boot)
    if (url === '/api/health' || url === '/health' || url === '/ping') {
      res.statusCode = 200;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: true, timestamp: new Date().toISOString() }));
      return;
    }

    // Ignore favicon/static asset requests
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

    const server = await bootstrapServer();
    return server(req, res);
  } catch (err) {
    console.error('❌ Serverless handler error:', err);
    res.statusCode = 500;
    res.setHeader('content-type', 'application/json');
    res.end(
      JSON.stringify({
        message: 'Internal Server Error',
        error: err.message,
      }),
    );
  }
}
