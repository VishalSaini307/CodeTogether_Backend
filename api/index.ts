import 'source-map-support/register';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import serverless from 'serverless-http';
import { AppModule } from '../src/app.module';

let cachedServer: any;

async function bootstrapServer() {
  if (cachedServer) return cachedServer;

  const expressApp = express();
  // create a Proxy wrapper so reads of `router` do not trigger Express's
  // deprecated getter which throws when accessed. Mirror approach used in src/main.ts
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

  const app = await NestFactory.create(AppModule, new ExpressAdapter(proxiedExpressApp));

  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://code-together-frontend.vercel.app'
    ],
    credentials: true,
  });

  await app.init();

  cachedServer = serverless(expressApp);
  return cachedServer;
}

export default async function handler(req: any, res: any) {
  const server = await bootstrapServer();
  return server(req, res);
}
