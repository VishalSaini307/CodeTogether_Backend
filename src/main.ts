import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { AppModule } from './app.module';

async function bootstrap(): Promise<any> {
	// create a plain express() instance and set legacy setting to avoid
	// Express v5 / Nest ExpressAdapter 'app.router' deprecation runtime error.
	const server = express();
	try {
		// this provides a safe fallback for adapters or libs expecting the old setting
		server.set('app.router', true);
	} catch {
		// ignore if running under environments that don't support set
	}

	const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
	app.enableCors({
		origin: 'http://localhost:3000',
		credentials: true,
		methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
		allowedHeaders: 'Content-Type,Authorization',
	});
	await app.init();

	return app;
}

if (require.main === module) {
	bootstrap().then(app => {
		const port = process.env.PORT ? Number(process.env.PORT) : 3000;
		// If app is a NestApplication with listen
		(app as any).listen ? (app as any).listen(port) : void 0;
	});
}

export default bootstrap;
