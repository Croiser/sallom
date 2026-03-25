import * as Sentry from "@sentry/node";
import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { initDb } from './server/db.js';
import prisma from './server/db.js';
import apiRoutes from './server/routes.js';
async function startServer() {
    const app = express();
    const PORT = 3000;
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || 'development',
        tracesSampleRate: 1.0,
    });
    // Middleware
    app.use(cors());
    app.use(express.json());
    // Request logging
    app.use((req, res, next) => {
        console.log(`${req.method} ${req.url}`);
        next();
    });
    // Initialize Database
    initDb();
    // API Routes
    app.use('/api', apiRoutes);
    app.get('/api/diag', async (req, res) => {
        try {
            const plans = await prisma.plan.findMany();
            const users = await prisma.user.findMany({ take: 3 });
            res.json({ plans, users, env: process.env.DATABASE_URL });
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
    app.get('/api/health', (req, res) => {
        res.json({ status: 'ok', message: 'Salão Pro Manager API is running' });
    });
    // 404 Handler for API (to prevent falling through to Vite/SPA fallback)
    app.use('/api', (req, res) => {
        console.warn(`API 404: ${req.method} ${req.url}`);
        res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
    });
    // Global Error Handler for API
    app.use('/api', (err, req, res, next) => {
        console.error('API Error:', err);
        res.status(err.status || 500).json({
            error: err.message || 'Internal Server Error',
        });
    });
    // Vite middleware for development
    if (process.env.NODE_ENV !== 'production') {
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: 'spa',
        });
        app.use(vite.middlewares);
    }
    else {
        // Production: serve static files from dist
        const distPath = path.join(process.cwd(), 'dist');
        app.use(express.static(distPath));
        app.get('*', (req, res) => {
            res.sendFile(path.join(distPath, 'index.html'));
        });
    }
    // The error handler must be registered before any other error middleware and after all controllers
    Sentry.setupExpressErrorHandler(app);
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}
startServer();
