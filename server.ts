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

  // Global Error Handler for API
  app.use('/api', (err: any, req: any, res: any, next: any) => {
    console.error('API Error:', err);
    res.status(err.status || 500).json({
      error: err.message || 'Internal Server Error',
    });
  });
  
  app.get('/api/diag', async (req, res) => {
    try {
      const plans = await (prisma as any).plan.findMany();
      const users = await (prisma as any).user.findMany({ take: 3 });
      res.json({ plans, users, env: process.env.DATABASE_URL });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Salão Pro Manager API is running' });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production: serve static files from dist
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
