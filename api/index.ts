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
  // Wrap the express app in a callable Proxy that intercepts `router` reads.
  // This prevents accessing the Express getter which throws on `app.router`.
  const proxiedExpressApp = new Proxy(function proxiedHandler(req: any, res: any, next?: any) {
    return (expressApp as any).apply(expressApp, arguments as any);
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
      return (expressApp as any).apply(thisArg, args);
    },
  });
  // Log express version to make runtime mismatches visible in Vercel logs
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const expressPkg = require('express/package.json');
    console.log('Express version:', expressPkg.version);
  } catch {
    console.warn('Failed to read express version: unknown');
  }
  // Some Express builds expose a getter for `app.router` which throws.
  // Ensure the instance has a concrete `_router` and set an own `router`
  // property that points to it so downstream code can safely read
  // `app.router` without triggering the deprecation throw.
  try {
    // initialize the internal router if available
    (expressApp as any).lazyrouter?.();
    if ((expressApp as any)._router) {
      Object.defineProperty(expressApp, 'router', {
        value: (expressApp as any)._router,
        configurable: true,
      });
    } else {
      // fall back to setting legacy setting for older adapters
      expressApp.set?.('app.router', true);
    }
  } catch {
    // ignore if environment doesn't support these ops
  }
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(proxiedExpressApp),
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
