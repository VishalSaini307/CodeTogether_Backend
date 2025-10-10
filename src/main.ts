import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { AppModule } from './app.module';


async function bootstrap(): Promise<any> {
	// create a plain express() instance and ensure it exposes a concrete
	// `router` property so Nest's ExpressAdapter can safely inspect it.
	const expressApp = express();
	// create a Proxy wrapper so reads of `router` do not trigger Express's
	// deprecated getter which throws.
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
