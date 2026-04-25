const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { updateStreak } = require('../services/streak');
const { checkBadges } = require('../services/badges');

// POST /api/sync/push — Replay offline queue sorted by timestamp
router.post('/push', protect, async (req, res) => {
  const { queue } = req.body;
  
  if (!queue || !Array.isArray(queue) || queue.length === 0) {
    return res.json({ message: 'Nothing to sync', processed: 0 });
  }

  try {
    const user = req.user;
    
    // Sort by timestamp ascending (offline events must be replayed in order)
    const sorted = [...queue].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    let processed = 0;

    for (const item of sorted) {
      try {
        const ts = new Date(item.timestamp);

        if (item.type === 'tick') {
          // Mark topic as studied
          const { subject, unit, topic } = item.data;
          const activeSyllabus = user.getActiveSyllabus();
          if (activeSyllabus?.subjects) {
            const subj = activeSyllabus.subjects.find(s => s.name === subject);
            if (subj) {
              const u = subj.units.find(u => u.name === unit);
              if (u) {
                const t = u.topics.find(t => t.name === topic);
                if (t && !t.studied) {
                  t.studied = true;
                  t.studied_at = ts;
                  user.gamification.total_topics_studied += 1;
                }
              }
            }
          }
          // Use offline timestamp for streak
          updateStreak(user, ts);
        } else if (item.type === 'quiz_result') {
          // Add quiz to history
          user.quiz_history.push({
            subject: item.data.subject || 'Mixed',
            topics: item.data.topics || [],
            score: item.data.score || 0,
            total: item.data.total || 0,
            date: ts,
            time_taken: item.data.time_taken || 0
          });
          user.gamification.total_quizzes_taken += 1;
          updateStreak(user, ts);
        } else if (item.type === 'confidence') {
          const { subject, unit, topic, confidence } = item.data;
          const activeSyllabus = user.getActiveSyllabus();
          if (activeSyllabus?.subjects) {
            const subj = activeSyllabus.subjects.find(s => s.name === subject);
            if (subj) {
              const u = subj.units.find(u => u.name === unit);
              if (u) {
                const t = u.topics.find(t => t.name === topic);
                if (t) t.confidence = confidence;
              }
            }
          }
        }

        processed++;
      } catch (itemErr) {
        console.error('Sync item error (skipping):', itemErr.message);
      }
    }

    // Increment offline sync count
    user.gamification.offline_sync_count = (user.gamification.offline_sync_count || 0) + 1;
    await user.save();

    // Non-blocking badge checks
    setImmediate(() => {
      checkBadges(user, { trigger: 'sync' });
      checkBadges(user, { trigger: 'tick' });
    });

    res.json({ message: 'Sync complete', processed });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ message: 'Sync failed' });
  }
});

module.exports = router;
