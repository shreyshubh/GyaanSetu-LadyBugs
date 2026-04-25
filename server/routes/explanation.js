const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { generateExplanationStream } = require('../services/groq');
const { retrieveChunks } = require('../services/vectorSearch');
const User = require('../models/User');

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

    // Step 4: Save to legacy history (non-blocking) using atomic operations
    setImmediate(async () => {
      try {
        await User.updateOne(
          { _id: req.user._id },
          { 
            $push: { 
              explanation_history: { 
                $each: [{ question, topic: topic || 'General', date: new Date() }],
                $position: 0,
                $slice: 20 
              } 
            } 
          }
        );
      } catch (err) {
        console.error('History save error:', err);
      }
    });
  } catch (error) {
    console.error('Explanation error:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Failed to generate explanation' });
    } else {
      res.end();
    }
  }
});

// ==================== CONVERSATION HISTORY ENDPOINTS ====================

// GET /api/explanation/history — List all conversations (lightweight)
router.get('/history', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('conversations');
    const list = (user.conversations || [])
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      .map(c => ({
        _id: c._id,
        topic: c.topic,
        subject: c.subject,
        preview: c.messages?.[0]?.content?.substring(0, 80) || '',
        message_count: c.messages?.length || 0,
        updated_at: c.updated_at
      }));
    res.json(list);
  } catch (error) {
    console.error('List history error:', error);
    res.status(500).json({ message: 'Failed to load history' });
  }
});

// GET /api/explanation/history/:conversationId — Get full conversation
router.get('/history/:conversationId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('conversations');
    const conv = user.conversations.id(req.params.conversationId);
    if (!conv) return res.status(404).json({ message: 'Conversation not found' });
    res.json(conv);
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ message: 'Failed to load conversation' });
  }
});

// POST /api/explanation/history — Create a new conversation
router.post('/history', protect, async (req, res) => {
  try {
    const { topic, subject } = req.body;
    const user = await User.findById(req.user._id);
    user.conversations.push({
      topic: topic || 'General',
      subject: subject || '',
      messages: [],
      created_at: new Date(),
      updated_at: new Date()
    });
    await user.save();
    const newConv = user.conversations[user.conversations.length - 1];
    res.json({ _id: newConv._id, topic: newConv.topic, subject: newConv.subject });
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ message: 'Failed to create conversation' });
  }
});

// PUT /api/explanation/history/:conversationId — Append message(s)
router.put('/history/:conversationId', protect, async (req, res) => {
  try {
    const { role, content } = req.body;
    if (!role || !content) return res.status(400).json({ message: 'role and content required' });

    const result = await User.updateOne(
      { _id: req.user._id, "conversations._id": req.params.conversationId },
      { 
        $push: { "conversations.$.messages": { role, content, timestamp: new Date() } },
        $set: { "conversations.$.updated_at": new Date() }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Append message error:', error);
    res.status(500).json({ message: 'Failed to save message' });
  }
});

// DELETE /api/explanation/history/:conversationId — Delete entire conversation
router.delete('/history/:conversationId', protect, async (req, res) => {
  try {
    const result = await User.updateOne(
      { _id: req.user._id },
      { $pull: { conversations: { _id: req.params.conversationId } } }
    );
    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: 'Conversation not found or already deleted' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({ message: 'Failed to delete conversation' });
  }
});

// DELETE /api/explanation/history/:conversationId/message/:messageIndex — Delete single message
// Note: Deleting by index concurrently can be unsafe, but we use a $unset followed by $pull to avoid VersionError.
// A more robust way is to use message _id if available, but since it's an array index, we'll fetch and update manually.
// To avoid VersionError, we'll load, splice, and save, but handle retries, OR we can just ignore VersionErrors for deletes.
// Wait, we can use an aggregation pipeline in updateOne for MongoDB 4.2+, but it's simpler to just do this:
router.delete('/history/:conversationId/message/:messageIndex', protect, async (req, res) => {
  try {
    const msgIndex = parseInt(req.params.messageIndex);
    
    // We can't $pull by index easily without using $unset + $pull(null).
    // Let's use the save() approach but only for this specific, rare action, since it's less likely to be concurrent.
    const user = await User.findById(req.user._id);
    const conv = user.conversations.id(req.params.conversationId);
    if (!conv) return res.status(404).json({ message: 'Conversation not found' });

    if (msgIndex < 0 || msgIndex >= conv.messages.length) {
      return res.status(400).json({ message: 'Invalid message index' });
    }

    conv.messages.splice(msgIndex, 1);
    conv.updated_at = new Date();
    await user.save();
    
    res.json({ success: true });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: 'Failed to delete message' });
  }
});

module.exports = router;
