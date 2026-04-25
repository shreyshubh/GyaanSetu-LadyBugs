const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { checkBadges } = require('../services/badges');

/**
 * Recalculate quiz_priority based on confidence + studied status
 */
const calcPriority = (confidence, studied) => {
  if (!studied) return 'medium'; // not studied = excluded from quiz, but keep a default
  if (confidence === 'weak') return 'high';
  if (confidence === 'confident') return 'low';
  return 'medium'; // neutral
};

/**
 * Find a topic in the user's syllabus by subject, unit, and topic name.
 * Returns { subject, unit, topic } references or null.
 */
const findTopic = (user, subjectName, unitName, topicName) => {
  const activeSyllabus = user.getActiveSyllabus();
  if (!activeSyllabus?.subjects) return null;
  const subject = activeSyllabus.subjects.find(s => s.name === subjectName);
  if (!subject) return null;
  const unit = subject.units.find(u => u.name === unitName);
  if (!unit) return null;
  const topic = unit.topics.find(t => t.name === topicName);
  if (!topic) return null;
  return { subject, unit, topic };
};

// PUT /api/tracker/tick — Mark topic as studied
router.put('/tick', protect, async (req, res) => {
  const { subject: subjectName, unit: unitName, topic: topicName, studied } = req.body;

  const found = findTopic(req.user, subjectName, unitName, topicName);
  if (!found) {
    return res.status(404).json({ message: 'Topic not found in syllabus' });
  }

  const wasStudied = found.topic.studied;
  found.topic.studied = studied !== undefined ? studied : true;
  found.topic.studied_at = new Date();

  // Recalculate priority
  found.topic.quiz_priority = calcPriority(found.topic.confidence, found.topic.studied);

  // Update gamification counter
  if (!wasStudied && found.topic.studied) {
    req.user.gamification.total_topics_studied += 1;
  } else if (wasStudied && !found.topic.studied) {
    req.user.gamification.total_topics_studied = Math.max(0, req.user.gamification.total_topics_studied - 1);
  }

  await req.user.save();

  // Non-blocking badge checks
  setImmediate(() => {
    checkBadges(req.user, { trigger: 'tick' });
  });

  res.json({ 
    message: 'Topic updated', 
    topic: found.topic,
    gamification: req.user.gamification 
  });
});

// PUT /api/tracker/confidence — Update confidence + recalculate quiz_priority
router.put('/confidence', protect, async (req, res) => {
  const { subject: subjectName, unit: unitName, topic: topicName, confidence } = req.body;

  if (!['confident', 'neutral', 'weak'].includes(confidence)) {
    return res.status(400).json({ message: 'Invalid confidence value' });
  }

  const found = findTopic(req.user, subjectName, unitName, topicName);
  if (!found) {
    return res.status(404).json({ message: 'Topic not found in syllabus' });
  }

  found.topic.confidence = confidence;
  found.topic.quiz_priority = calcPriority(confidence, found.topic.studied);

  await req.user.save();

  res.json({ message: 'Confidence updated', topic: found.topic });
});

// GET /api/tracker/due-for-review — Topics where studied_at AND last_tested ≥ 7 days ago
router.get('/due-for-review', protect, async (req, res) => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const dueTopics = [];

  const activeSyllabus = req.user.getActiveSyllabus();
  if (activeSyllabus?.subjects) {
    for (const subject of activeSyllabus.subjects) {
      for (const unit of subject.units) {
        for (const topic of unit.topics) {
          if (topic.studied && topic.studied_at) {
            const studiedOld = new Date(topic.studied_at) <= sevenDaysAgo;
            const testedOld = !topic.last_tested || new Date(topic.last_tested) <= sevenDaysAgo;
            if (studiedOld && testedOld) {
              dueTopics.push({
                subject: subject.name,
                unit: unit.name,
                topic: topic.name,
                confidence: topic.confidence,
                studied_at: topic.studied_at,
                last_tested: topic.last_tested
              });
            }
          }
        }
      }
    }
  }

  res.json({ dueTopics });
});

module.exports = router;
