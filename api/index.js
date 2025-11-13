"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
require("source-map-support/register");
const core_1 = require("@nestjs/core");
const platform_express_1 = require("@nestjs/platform-express");
const app_module_1 = require("../src/app.module");
const express_1 = __importDefault(require("express"));
const serverless_http_1 = __importDefault(require("serverless-http"));
let cachedServer = null;
async function bootstrapServer() {
    if (cachedServer)
        return cachedServer;
    const expressApp = (0, express_1.default)();
    const adapter = new platform_express_1.ExpressAdapter(expressApp);
    const app = await core_1.NestFactory.create(app_module_1.AppModule, adapter, {
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
    cachedServer = (0, serverless_http_1.default)(expressApp);
    return cachedServer;
}
async function handler(req, res) {
    try {
        const url = req?.url || req?.originalUrl || '';
        if (url === '/api/health' || url === '/health' || url === '/ping') {
            res.statusCode = 200;
            res.setHeader('content-type', 'application/json');
            res.end(JSON.stringify({ ok: true, message: 'NestJS is healthy 🚀' }));
            return;
        }
        const lower = url.split('?')[0].toLowerCase();
        if (lower.endsWith('.ico') ||
            lower.endsWith('.png') ||
            lower.endsWith('.svg') ||
            lower === '/favicon.ico' ||
            lower === '/favicon.png') {
            res.statusCode = 204;
            res.setHeader('cache-control', 'public, max-age=86400');
            res.end();
            return;
        }
        const server = await bootstrapServer();
        return server(req, res);
    }
    catch (err) {
        console.error('❌ Serverless handler error:', err);
        res.statusCode = 500;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({
            message: 'Internal Server Error',
            error: err?.message || err,
        }));
    }
}
//# sourceMappingURL=index.js.map