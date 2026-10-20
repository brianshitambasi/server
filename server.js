// Force Node.js to use public DNS for SRV lookups (Windows dev only)
require('dns').setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const connectDB = require('./config/db');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/error.middleware');

const app = express();

app.set('trust proxy', 1);

// CORS allow-list
// Hard-coded defaults + whatever is in CLIENT_ORIGIN env var (both used).
const HARDCODED_ORIGINS = [
  'http://localhost:3000',
  'https://brian-ceotnt.vercel.app',
  'https://brianceotnt.devs.li'
];

const envOrigins = (process.env.CLIENT_ORIGIN || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const allowedOrigins = Array.from(new Set([...HARDCODED_ORIGINS, ...envOrigins]));

console.log('[CORS] Allowed origins:', allowedOrigins);

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow non-browser clients (curl, mobile apps, Postman)
      if (!origin) return cb(null, true);

      // Exact match against the allow-list
      if (allowedOrigins.includes(origin)) return cb(null, true);

      // Auto-allow any vercel.app or railway.app preview URL
      if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)) return cb(null, true);
      if (/^https:\/\/[a-z0-9-]+\.railway\.app$/i.test(origin)) return cb(null, true);

      // Allow localhost on any port
      if (/^http:\/\/localhost(:\d+)?$/i.test(origin)) return cb(null, true);

      console.warn('[CORS] Blocked origin:', origin);
      return cb(new Error(`CORS blocked: ${origin}`));
    },
    credentials: false
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Root status
app.get('/', (req, res) => {
  res.json({ service: 'BRIAN — CEO TNT API', status: 'ok', time: new Date().toISOString() });
});

// API routes
app.use('/api', routes);

// 404 + errors
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

(async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`[BRIAN — CEO TNT API] running on port ${PORT}`);
  });
})();
