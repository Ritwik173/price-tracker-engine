import express from 'express';
import cors from 'cors';
import env from './config/env.js';
import logger from './utils/logger.js';
import { PrismaClient as GeneratedPrismaClient } from './generated/prisma/client.ts';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { initCronJobs } from './jobs/priceTracker.js';
import productRoutes from './routes/products.js';
import alertRoutes from './routes/alerts.js';

// --- Initialize Prisma with SQLite adapter ---
const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || 'file:./prisma/dev.db',
});
export const prisma = new GeneratedPrismaClient({ adapter });

// --- Create Express App ---
const app = express();

// --- Middleware ---
app.use(cors({
  origin: env.nodeEnv === 'development' ? 'http://localhost:5173' : '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  credentials: true,
}));
app.use(express.json());

// --- API Routes ---
app.use('/api/products', productRoutes);
app.use('/api/alerts', alertRoutes);

// --- Request Logger (dev only) ---
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const color = status >= 400 ? '🔴' : status >= 300 ? '🟡' : '🟢';
    logger.info('HTTP', `${color} ${req.method} ${req.originalUrl} → ${status} (${duration}ms)`);
  });
  next();
});

// --- Health Check ---
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        sendgrid: env.isSendgridConfigured ? 'configured' : 'not configured',
        twilio: env.isTwilioConfigured ? 'configured' : 'not configured',
      },
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
    });
  }
});

// --- Placeholder for routes (will add in Phase 5) ---
// import productRoutes from './routes/products.js';
// import alertRoutes from './routes/alerts.js';
// app.use('/api/products', productRoutes);
// app.use('/api/alerts', alertRoutes);

// --- 404 Handler ---
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.originalUrl });
});

// --- Error Handler ---
app.use((err, req, res, next) => {
  logger.error('Server', err.message, err);
  res.status(500).json({ error: 'Internal server error' });
});

// --- Start Server ---
async function start() {
  try {
    // Verify database connection
    await prisma.$connect();
    logger.success('Database', 'Connected to SQLite');

    // Start cron jobs
    initCronJobs();

    app.listen(env.port, () => {
      console.log('');
      console.log('  ╔══════════════════════════════════════════╗');
      console.log('  ║   💰 Price Tracker & Alert Engine        ║');
      console.log(`  ║   🌐 http://localhost:${env.port}               ║`);
      console.log('  ║   📊 Dashboard: http://localhost:5173    ║');
      console.log('  ╚══════════════════════════════════════════╝');
      console.log('');
      logger.info('Server', `Running in ${env.nodeEnv} mode`);
      logger.info('Services', `SendGrid: ${env.isSendgridConfigured ? '✅' : '⏳ Not configured'}`);
      logger.info('Services', `Twilio:   ${env.isTwilioConfigured ? '✅' : '⏳ Not configured'}`);
    });
  } catch (error) {
    logger.error('Startup', 'Failed to start server', error);
    process.exit(1);
  }
}

// --- Graceful Shutdown ---
process.on('SIGINT', async () => {
  logger.info('Server', 'Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

start();
