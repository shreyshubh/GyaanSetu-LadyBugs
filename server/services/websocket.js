const { WebSocketServer } = require('ws');
const jwt = require('jsonwebtoken');

// WebSocket client map
const clients = new Map(); // userId → WebSocket instance

const initWebSocket = (server) => {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws, req) => {
    const token = new URL(req.url, 'http://localhost').searchParams.get('token');
    if (!token) {
      ws.close(1008, 'Missing token');
      return;
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.id?.toString() || decoded._id?.toString();
      if (!userId) {
        ws.close(1008, 'Invalid token');
        return;
      }
      clients.set(userId, ws);
      ws.on('close', () => clients.delete(userId));
      ws.on('error', () => clients.delete(userId));
    } catch {
      ws.close(1008, 'Unauthorized');
    }
  });

  return wss;
};

const pushCareerUpdate = async (userId) => {
  const ws = clients.get(userId.toString());
  if (!ws || ws.readyState !== 1) return; // 1 = OPEN
  try {
    const User = require('../models/User');
    const { generateCareerGuidance } = require('./groq');
    
    const user = await User.findById(userId);
    if (!user) return;

    const activeSyllabus = user.getActiveSyllabus();
    const studiedTopics = [];
    const unstudiedTopics = [];

    if (activeSyllabus?.subjects) {
      for (const subj of activeSyllabus.subjects) {
        for (const unit of subj.units) {
          for (const topic of unit.topics) {
            if (topic.studied) studiedTopics.push(topic.name);
            else unstudiedTopics.push(topic.name);
          }
        }
      }
    }

    const careerData = await generateCareerGuidance(studiedTopics, unstudiedTopics, user.language || 'en');
    ws.send(JSON.stringify({ type: 'CAREER_UPDATE', payload: careerData }));
  } catch (err) {
    console.error('WebSocket pushCareerUpdate error:', err.message);
  }
};

module.exports = { initWebSocket, pushCareerUpdate };
