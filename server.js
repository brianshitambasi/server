// Force Node.js to use public DNS for SRV lookups (Windows dev only — harmless on Render)
require('dns').setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const connectDB = require('./config/db');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/error.middleware');

const app = express();

// Render sits behind a proxy — required for express-rate-limit to work correctly
app.set('trust proxy', 1);

// CORS — split the comma-separated CLIENT_ORIGIN into an array
const rawOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, cb) => {
    // Allow non-browser clients (curl, Postman, mobile apps)
    if (!origin) return cb(null, true);
    if (rawOrigins.includes(origin)) return cb(null, true);
    // Allow any vercel.app / onrender.com subdomain (covers preview URLs)
    if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)) return cb(null, true);
    if (/^https:\/\/[a-z0-9-]+\.onrender\.com$/i.test(origin)) return cb(null, true);
    // Allow localhost on any port
    if (/^http:\/\/localhost(:\d+)?$/i.test(origin)) return cb(null, true);

    console.warn('[CORS] Blocked origin:', origin);
    return cb(new Error(`CORS blocked: ${origin}`));
  },
  credentials: false
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Root status
app.get('/', (req, res) => {
  res.json({ service: 'YOBBYTECH API', status: 'ok', time: new Date().toISOString() });
});

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

(async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`[YOBBYTECH API] running on port ${PORT}`);
  });
})();
