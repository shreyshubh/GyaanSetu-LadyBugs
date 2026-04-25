const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { generateExplanationStream } = require('../services/groq');
const { retrieveChunks } = require('../services/vectorSearch');

// POST /api/explanation/ask — RAG-powered explanation with streaming
router.post('/ask', protect, async (req, res) => {
  const { question, topic } = req.body;
  
  if (!question) {
    return res.status(400).json({ message: 'Question is required' });
  }

  try {
    const language = req.user.language || 'en';
    
    // Step 1: Retrieve relevant chunks via vector search
    const queryText = topic ? `${topic} ${question}` : question;
    let chunks = [];
    try {
      const activeSyllabus = req.user.getActiveSyllabus();
      chunks = await retrieveChunks(req.user._id.toString(), activeSyllabus._id?.toString(), queryText, 5);
    } catch (err) {
      console.warn('Vector search failed, proceeding without context:', err.message);
    }

    // Step 2: Build RAG context
    const context = chunks.length > 0
      ? chunks.map(c => `[${c.subject} > ${c.unit} > ${c.topic}]: ${c.text}`).join('\n')
      : 'No specific syllabus context available. Use general knowledge.';

    // Step 3: Stream response
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await generateExplanationStream(question, context, topic || 'General Questions', language);
    
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Explanation error:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Failed to generate explanation' });
    } else {
      res.end();
    }
  }
});

module.exports = router;
