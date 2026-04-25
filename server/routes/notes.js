const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { generateNotes } = require('../services/groq');

// POST /api/notes/generate — AI-generated study notes
router.post('/generate', protect, async (req, res) => {
  const { topic, subject, unit } = req.body;

  if (!topic) {
    return res.status(400).json({ message: 'Topic is required' });
  }

  try {
    const language = req.user.language || 'en';
    
    // Find confidence level for this topic
    let confidence = 'neutral';
    if (req.user.syllabus?.subjects) {
      for (const s of req.user.syllabus.subjects) {
        for (const u of s.units) {
          const t = u.topics.find(top => top.name === topic);
          if (t) confidence = t.confidence || 'neutral';
        }
      }
    }

    const markdown = await generateNotes(topic, subject || 'General', unit || 'General', confidence, language);
    res.json({ topic, subject, unit, markdown });
  } catch (error) {
    console.error('Notes generation error:', error);
    res.status(500).json({ message: 'Failed to generate notes' });
  }
});

module.exports = router;
