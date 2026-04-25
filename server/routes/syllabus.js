const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { protect } = require('../middleware/auth');
const { extractSyllabusTopics } = require('../services/groq');
const { storeEmbeddings } = require('../services/vectorSearch');
const { pushCareerUpdate } = require('../services/websocket');
const User = require('../models/User');

/**
 * Strip headers, footers, and page numbers from raw text
 */
const cleanRawText = (text) => {
  return text
    .split('\n')
    .filter(line => {
      const trimmed = line.trim();
      // Remove page numbers
      if (/^(page\s*)?\d+(\s*of\s*\d+)?$/i.test(trimmed)) return false;
      // Remove very short lines that are likely headers/footers
      if (trimmed.length < 3 && /^\d+$/.test(trimmed)) return false;
      return true;
    })
    .join('\n');
};

const extractText = async (buffer, mimetype) => {
  if (mimetype === 'application/pdf') {
    const data = await pdfParse(buffer);
    return cleanRawText(data.text);
  } else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const { value } = await mammoth.extractRawText({ buffer });
    return cleanRawText(value);
  }
  return '';
};

// POST /api/syllabus/upload — Parse file and extract topics via Groq
router.post('/upload', protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    
    const rawText = await extractText(req.file.buffer, req.file.mimetype);
    
    if (!rawText || rawText.trim().length === 0) {
      return res.status(400).json({ message: 'Could not extract text from file' });
    }

    const topics = await extractSyllabusTopics(rawText);

    res.json({ topics, rawText });
  } catch (err) {
    console.error('Upload Error:', err);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/syllabus/save — Save structured syllabus + batch embed
router.post('/save', protect, async (req, res) => {
  const { subjects, name } = req.body;
  const syllabusName = name || 'My Syllabus ' + (req.user.syllabi.length + 1);
  
  if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
    return res.status(400).json({ message: 'Missing subjects array' });
  }

  try {
    // Append to syllabi array
    req.user.syllabi.push({
      name: syllabusName,
      subjects
    });
    
    // Set as active
    req.user.activeSyllabusId = req.user.syllabi[req.user.syllabi.length - 1]._id;
    await req.user.save();

    // Batch embed all topics (non-blocking is fine, but we wait for consistency)
    try {
      await storeEmbeddings(req.user._id, req.user.activeSyllabusId, subjects);
      console.log(`Stored embeddings for user ${req.user._id} syllabus ${req.user.activeSyllabusId}`);
    } catch (embedErr) {
      console.error('Embedding storage warning (non-critical):', embedErr.message);
      // Don't fail the save if embeddings fail
    }

    const activeSyllabus = req.user.syllabi.id(req.user.activeSyllabusId);
    
    // Trigger real-time career update
    setImmediate(() => { pushCareerUpdate(req.user._id); });

    res.json({ message: 'Syllabus saved and vectorized!', subjects: activeSyllabus.subjects, activeSyllabusId: req.user.activeSyllabusId, syllabi: req.user.syllabi });
  } catch (error) {
    console.error('Save Error:', error);
    res.status(500).json({ message: 'Failed to save syllabus' });
  }
});

// GET /api/syllabus — Return user's full syllabus
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('syllabi activeSyllabusId syllabus');
    
    // Fallback logic handled by auth.js migrateSyllabus, but just in case
    let active = null;
    if (user.activeSyllabusId && user.syllabi) {
      active = user.syllabi.id(user.activeSyllabusId);
    } else if (user.syllabi && user.syllabi.length > 0) {
      active = user.syllabi[0];
    } else if (user.syllabus && user.syllabus.subjects) {
      return res.json({ subjects: user.syllabus.subjects });
    }
    
    res.json({ subjects: active?.subjects || [], syllabi: user.syllabi, activeSyllabusId: user.activeSyllabusId });
  } catch (error) {
    console.error('Get syllabus error:', error);
    res.status(500).json({ message: 'Failed to retrieve syllabus' });
  }
});

// PUT /api/syllabus/active — Switch active syllabus
router.put('/active', protect, async (req, res) => {
  try {
    const { syllabusId } = req.body;
    if (!syllabusId) return res.status(400).json({ message: 'Missing syllabusId' });
    
    const exists = req.user.syllabi.id(syllabusId);
    if (!exists) return res.status(404).json({ message: 'Syllabus not found' });
    
    req.user.activeSyllabusId = syllabusId;
    await req.user.save();
    
    // Trigger real-time career update
    setImmediate(() => { pushCareerUpdate(req.user._id); });

    res.json({ message: 'Active syllabus updated', activeSyllabusId: syllabusId, subjects: exists.subjects });
  } catch (error) {
    console.error('Set active syllabus error:', error);
    res.status(500).json({ message: 'Failed to switch syllabus' });
  }
});

// PUT /api/syllabus/edit — Replace syllabus, re-embed, preserve existing topic metadata by name match
router.put('/edit', protect, async (req, res) => {
  const { subjects: newSubjects } = req.body;

  if (!newSubjects || !Array.isArray(newSubjects)) {
    return res.status(400).json({ message: 'Missing subjects array' });
  }

  try {
    const activeSyllabus = req.user.syllabi.id(req.user.activeSyllabusId);
    if (!activeSyllabus) return res.status(404).json({ message: 'Active syllabus not found' });

    const oldSubjects = activeSyllabus.subjects || [];

    // Build a lookup map of old topic metadata: "SubjectName|UnitName|TopicName" → topicData
    const oldTopicMap = {};
    for (const subj of oldSubjects) {
      for (const unit of subj.units) {
        for (const topic of unit.topics) {
          const key = `${subj.name}|${unit.name}|${topic.name}`;
          oldTopicMap[key] = {
            confidence: topic.confidence,
            studied: topic.studied,
            studied_at: topic.studied_at,
            last_tested: topic.last_tested,
            score: topic.score,
            quiz_priority: topic.quiz_priority
          };
        }
      }
    }

    // Merge old metadata into new subjects
    for (const subj of newSubjects) {
      for (const unit of subj.units) {
        for (const topic of unit.topics) {
          const key = `${subj.name}|${unit.name}|${topic.name}`;
          if (oldTopicMap[key]) {
            Object.assign(topic, oldTopicMap[key]);
          }
        }
      }
    }

    activeSyllabus.subjects = newSubjects;
    await req.user.save();

    // Re-embed
    try {
      await storeEmbeddings(req.user._id, req.user.activeSyllabusId, newSubjects);
    } catch (embedErr) {
      console.error('Re-embedding warning:', embedErr.message);
    }

    // Trigger real-time career update
    setImmediate(() => { pushCareerUpdate(req.user._id); });

    res.json({ message: 'Syllabus updated!', subjects: activeSyllabus.subjects });
  } catch (error) {
    console.error('Edit error:', error);
    res.status(500).json({ message: 'Failed to edit syllabus' });
  }
});

// DELETE /api/syllabus — Delete entire syllabus and cleanup related data
router.delete('/', protect, async (req, res) => {
  try {
    const user = req.user;
    const Embedding = require('../models/Embedding');

    // Clear active syllabus subjects
    const activeSyllabus = user.syllabi.id(user.activeSyllabusId);
    if (activeSyllabus) {
      activeSyllabus.subjects = [];
    }

    // Delete ALL embeddings for this user
    await Embedding.deleteMany({ user_id: user._id.toString() });

    // Reset syllabus-dependent gamification fields (preserve streaks, badges, quiz history)
    user.gamification.total_topics_studied = 0;

    await user.save();

    // Trigger real-time career update
    setImmediate(() => { pushCareerUpdate(user._id); });

    res.json({ success: true, message: 'Syllabus and all related embeddings deleted.' });
  } catch (error) {
    console.error('Delete syllabus error:', error);
    res.status(500).json({ message: 'Failed to delete syllabus' });
  }
});

// DELETE /api/syllabus/subject/:subjectName — Delete a single subject
router.delete('/subject/:subjectName', protect, async (req, res) => {
  try {
    const user = req.user;
    const subjectName = decodeURIComponent(req.params.subjectName);
    const Embedding = require('../models/Embedding');

    const activeSyllabus = user.syllabi.id(user.activeSyllabusId);
    if (!activeSyllabus) return res.status(404).json({ message: 'Active syllabus not found' });

    // Remove the subject
    const originalLength = activeSyllabus.subjects.length;
    activeSyllabus.subjects = activeSyllabus.subjects.filter(s => s.name !== subjectName);

    if (activeSyllabus.subjects.length === originalLength) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    // Delete embeddings scoped to that subject
    await Embedding.deleteMany({ user_id: user._id.toString(), subject: subjectName });

    // Recalculate total_topics_studied
    let totalStudied = 0;
    for (const subj of activeSyllabus.subjects) {
      for (const unit of subj.units) {
        for (const topic of unit.topics) {
          if (topic.studied) totalStudied++;
        }
      }
    }
    user.gamification.total_topics_studied = totalStudied;

    await user.save();

    // Trigger real-time career update
    setImmediate(() => { pushCareerUpdate(user._id); });

    res.json({ success: true, subjects: activeSyllabus.subjects });
  } catch (error) {
    console.error('Delete subject error:', error);
    res.status(500).json({ message: 'Failed to delete subject' });
  }
});

module.exports = router;
