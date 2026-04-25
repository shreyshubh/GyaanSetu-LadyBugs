const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

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

module.exports = app;
