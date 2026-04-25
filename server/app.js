const express = require('express');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// 1. Security headers
app.use(helmet());

// 2. CORS
app.use(cors());

// 3. Body parsing
app.use(express.json({ limit: '10mb' }));

// 4. NoSQL injection prevention — handled via explicit type casting in auth.js
// (express-mongo-sanitize v2 is incompatible with Express 5's read-only req.query getter)

// 5. Rate limiting — global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', globalLimiter);

// 6. Auth route stricter rate limit (prevent brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts. Try again in 15 minutes.' }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);

// Keep-alive endpoint (no auth — registered BEFORE everything else)
app.get('/api/ping', (req, res) => res.status(200).json({ status: 'ok' }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/syllabus', require('./routes/syllabus'));
app.use('/api/tracker', require('./routes/tracker'));
app.use('/api/quiz', require('./routes/quiz'));
app.use('/api/explanation', require('./routes/explanation'));
app.use('/api/notes', require('./routes/notes'));
app.use('/api/career', require('./routes/career'));
app.use('/api/badges', require('./routes/badges'));
app.use('/api/sync', require('./routes/sync'));

// Global error handler — strip details in production
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.stack || err.message);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : err.message
  });
});

module.exports = app;
